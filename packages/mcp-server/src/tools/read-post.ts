import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import type { Graph } from '@agent-tale/core';

export interface ReadPostInput {
  slug: string;
  include_backlinks?: boolean;
  include_related?: boolean;
}

export function readPost(input: ReadPostInput, graph: Graph) {
  const { slug, include_backlinks = true, include_related = true } = input;

  const node = graph.nodes.get(slug);
  if (!node) {
    return { error: `Post "${slug}" not found.` };
  }

  const fileContent = readFileSync(join(process.cwd(), node.filePath), 'utf-8');
  const { data: frontmatter, content } = matter(fileContent);

  const result: Record<string, unknown> = { frontmatter, content };

  if (include_backlinks) {
    result.backlinks = graph.getBacklinks(slug).map((n) => ({
      slug: n.slug,
      title: n.title,
    }));
  }

  if (include_related) {
    result.related = graph.getRelated(slug).map((n) => ({
      slug: n.slug,
      title: n.title,
    }));
  }

  return result;
}
