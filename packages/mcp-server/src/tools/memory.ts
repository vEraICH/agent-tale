import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import matter from 'gray-matter';
import { buildGraph, createGraph } from '@agent-tale/core';
import type { Graph } from '@agent-tale/core';
import { writePost } from './write-post.js';
import { search } from './search.js';
import { getGraphNeighborhood } from './get-graph.js';

export function memoryDirFrom(contentDir: string): string {
  return join(dirname(contentDir), 'memory');
}

function buildMemoryGraph(memoryDir: string): Graph {
  const result = buildGraph({ contentDir: memoryDir, collection: 'memory' });
  return createGraph(result.nodes, result.edges);
}

function generateSlug(): string {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const suffix = Date.now().toString(36).slice(-5);
  return `memory-${date}-${suffix}`;
}

// ── store_memory ──────────────────────────────────────────────────

export interface StoreMemoryInput {
  content: string;
  title?: string;
  tags?: string[];
  agent_id?: string;
  confidence?: number;
  sources?: string[];
}

export function storeMemory(
  input: StoreMemoryInput,
  memoryDir: string,
): { slug: string; file_path: string } {
  const { content, tags, agent_id, confidence, sources } = input;
  const title = input.title ?? content.split('\n')[0].replace(/^#+\s*/, '').slice(0, 80);
  const slug = generateSlug();

  const filePath = writePost(
    { slug, title, content, tags, agent: agent_id, confidence, sources, type: 'memory' },
    { contentDir: memoryDir },
  );

  return { slug, file_path: filePath };
}

// ── retrieve_memory ───────────────────────────────────────────────

export interface RetrieveMemoryInput {
  query: string;
  limit?: number;
  agent_id?: string;
}

export interface MemoryItem {
  slug: string;
  title: string;
  content: string;
  confidence: number | null;
  agent: string | null;
  tags: string[];
  backlinks: { slug: string; title: string }[];
}

export function retrieveMemory(
  input: RetrieveMemoryInput,
  memoryDir: string,
): MemoryItem[] {
  const { query, limit = 5, agent_id } = input;

  if (!existsSync(memoryDir)) return [];

  const graph = buildMemoryGraph(memoryDir);
  let results = search({ query, limit: limit * 3, collection: 'memory' }, graph);

  if (agent_id) {
    results = results.filter((n) => n.agent === agent_id);
  }

  return results.slice(0, limit).map((node) => {
    const raw = readFileSync(join(memoryDir, node.filePath), 'utf-8');
    const { data: fm, content } = matter(raw);
    const backlinks = graph.getBacklinks(node.slug).map((n) => ({
      slug: n.slug,
      title: n.title,
    }));

    return {
      slug: node.slug,
      title: node.title,
      content,
      confidence: (fm.confidence as number | undefined) ?? null,
      agent: node.agent,
      tags: node.tags,
      backlinks,
    };
  });
}

// ── get_memory_context ────────────────────────────────────────────

export interface GetMemoryContextInput {
  slug: string;
  depth?: number;
}

export function getMemoryContext(
  input: GetMemoryContextInput,
  memoryDir: string,
) {
  if (!existsSync(memoryDir)) return { error: 'No memories stored yet.' };

  const graph = buildMemoryGraph(memoryDir);
  const neighborhood = getGraphNeighborhood(input.slug, input.depth ?? 2, graph);

  if ('error' in neighborhood) return neighborhood;

  const node = graph.nodes.get(input.slug);
  if (!node) return { error: `Memory "${input.slug}" not found.` };

  const raw = readFileSync(join(memoryDir, node.filePath), 'utf-8');
  const { data: frontmatter, content } = matter(raw);

  return {
    focal: { slug: input.slug, frontmatter, content },
    neighborhood,
  };
}
