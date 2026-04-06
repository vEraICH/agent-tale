/**
 * Graph Builder — scan .md files, extract links, build adjacency map.
 *
 * This is the heart of Agent-Tale. It reads markdown files from disk,
 * parses frontmatter + wikilinks, and constructs a bidirectional graph.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, basename, extname } from 'node:path';
import { createHash } from 'node:crypto';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { PostSchema, type PostFrontmatter } from '../content/frontmatter.js';
import { remarkWikilinks, type WikilinkData } from '../content/wikilinks.js';
import { remarkReadingTime } from '../content/reading-time.js';
import type { GraphNode, GraphEdge } from './types.js';

export interface BuildGraphOptions {
  /** Root directory containing .md/.mdx files */
  contentDir: string;
  /** Collection name (defaults to directory name or "posts") */
  collection?: string;
  /** File extensions to scan */
  extensions?: string[];
}

export interface BuildGraphResult {
  nodes: Map<string, GraphNode>;
  edges: GraphEdge[];
  errors: GraphBuildError[];
}

export interface GraphBuildError {
  file: string;
  slug: string;
  type: 'frontmatter' | 'parse' | 'broken-link';
  message: string;
}

/** Derive slug from file path (filename without extension). */
export function slugFromPath(filePath: string): string {
  return basename(filePath, extname(filePath));
}

/** Compute content hash for incremental build detection. */
function contentHash(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

/** Recursively find all markdown files in a directory. */
function findMarkdownFiles(
  dir: string,
  extensions: string[],
): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
    let entries: string[];
    try {
      entries = readdirSync(currentDir);
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = join(currentDir, entry);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (extensions.includes(extname(entry).toLowerCase())) {
          files.push(fullPath);
        }
      } catch {
        // Skip inaccessible files
      }
    }
  }

  walk(dir);
  return files;
}

/**
 * Build a content graph from markdown files on disk.
 *
 * Scans all .md/.mdx files in the content directory, parses frontmatter
 * and wikilinks, and returns a bidirectional graph of nodes and edges.
 */
export function buildGraph(options: BuildGraphOptions): BuildGraphResult {
  const {
    contentDir,
    collection = 'posts',
    extensions = ['.md', '.mdx'],
  } = options;

  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  const errors: GraphBuildError[] = [];

  // Step 1: Find all markdown files
  const files = findMarkdownFiles(contentDir, extensions);

  // Step 2: Parse each file — extract frontmatter + wikilinks
  for (const filePath of files) {
    const slug = slugFromPath(filePath);
    const rawContent = readFileSync(filePath, 'utf-8');
    const hash = contentHash(rawContent);

    // Parse frontmatter
    let parsed: matter.GrayMatterFile<string>;
    try {
      parsed = matter(rawContent);
    } catch (err) {
      errors.push({
        file: relative(contentDir, filePath),
        slug,
        type: 'parse',
        message: `Failed to parse frontmatter: ${err instanceof Error ? err.message : String(err)}`,
      });
      continue;
    }

    // Validate frontmatter with Zod
    const validation = PostSchema.safeParse(parsed.data);
    let frontmatter: PostFrontmatter;

    if (!validation.success) {
      errors.push({
        file: relative(contentDir, filePath),
        slug,
        type: 'frontmatter',
        message: validation.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      });
      // Use partial data — don't skip the file entirely
      frontmatter = {
        title: (parsed.data as Record<string, unknown>).title as string ?? slug,
        date: new Date(),
        draft: false,
        type: 'post' as const,
        tags: [],
      };
    } else {
      frontmatter = validation.data;
    }

    // Extract wikilinks via remark
    const collectedLinks: WikilinkData[] = [];
    try {
      const processor = unified()
        .use(remarkParse)
        .use(remarkWikilinks, {
          onWikilink: (data: WikilinkData) => collectedLinks.push(data),
        })
        .use(remarkReadingTime);

      const tree = processor.parse(parsed.content);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (processor as any).runSync(tree);
    } catch (err) {
      errors.push({
        file: relative(contentDir, filePath),
        slug,
        type: 'parse',
        message: `Failed to parse markdown: ${err instanceof Error ? err.message : String(err)}`,
      });
    }

    // Create node
    const node: GraphNode = {
      slug,
      title: frontmatter.title,
      description: frontmatter.description ?? null,
      collection,
      filePath: relative(contentDir, filePath),
      contentHash: hash,
      date: frontmatter.date.toISOString(),
      tags: frontmatter.tags,
      agent: frontmatter.agent ?? null,
      inDegree: 0, // Computed after all edges are collected
      outDegree: collectedLinks.length,
    };

    nodes.set(slug, node);

    // Create edges from wikilinks
    for (const link of collectedLinks) {
      edges.push({
        source: slug,
        target: link.slug,
        linkType: 'wikilink',
        context: link.raw,
      });
    }
  }

  // Step 3: Compute inDegree for all nodes
  for (const edge of edges) {
    const targetNode = nodes.get(edge.target);
    if (targetNode) {
      targetNode.inDegree++;
    }
  }

  // Step 4: Report broken links (edges pointing to non-existent nodes)
  for (const edge of edges) {
    if (!nodes.has(edge.target)) {
      const sourceNode = nodes.get(edge.source);
      errors.push({
        file: sourceNode?.filePath ?? edge.source,
        slug: edge.source,
        type: 'broken-link',
        message: `Broken wikilink: [[${edge.target}]] — target does not exist`,
      });
    }
  }

  return { nodes, edges, errors };
}
