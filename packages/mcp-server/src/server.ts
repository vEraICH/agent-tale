import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { buildGraph, createGraph } from '@agent-tale/core';
import { writePost } from './tools/write-post.js';
import { readPost } from './tools/read-post.js';
import { search } from './tools/search.js';
import { getBacklinks } from './tools/get-backlinks.js';
import { getGraphNeighborhood } from './tools/get-graph.js';
import { suggestLinks } from './tools/suggest-links.js';
import { getOrphans } from './tools/get-orphans.js';
import { getRecent } from './tools/get-recent.js';
import type { Graph } from '@agent-tale/core';

export interface ServerOptions {
  contentDir: string;
  collection?: string;
}

function buildLiveGraph(contentDir: string, collection: string): Graph {
  const result = buildGraph({ contentDir, collection });
  return createGraph(result.nodes, result.edges);
}

export async function startServer(opts: ServerOptions) {
  const { contentDir, collection = 'posts' } = opts;

  const server = new McpServer({
    name: 'agent-tale',
    version: '0.1.0',
  });

  // ── write_post ────────────────────────────────────────────────
  server.tool(
    'write_post',
    'Create or update a markdown post in the knowledge graph.',
    {
      slug: z.string().describe('URL-friendly identifier (e.g. "my-post")'),
      title: z.string().describe('Post title'),
      content: z.string().describe('Markdown body. Wikilinks [[slug]] are supported.'),
      tags: z.array(z.string()).optional().describe('Optional tags'),
      draft: z.boolean().optional().describe('If true, post is not published (default: false)'),
      agent: z.string().optional().describe('Agent identifier'),
      confidence: z.number().min(0).max(1).optional().describe('Epistemic confidence 0-1'),
      sources: z.array(z.string()).optional().describe('Source URLs referenced in this post'),
      type: z.enum(['post', 'knowledge', 'lesson', 'dialogue']).optional().describe('Post type'),
      consolidated_from: z.array(z.string()).optional().describe('Slugs this post was consolidated from'),
    },
    async (input) => {
      const filePath = writePost(input, { contentDir });
      return {
        content: [{ type: 'text', text: `Written: ${filePath}` }],
      };
    },
  );

  // ── read_post ─────────────────────────────────────────────────
  server.tool(
    'read_post',
    'Read a post\'s content and graph context (backlinks, related posts).',
    {
      slug: z.string().describe('Post slug'),
      include_backlinks: z.boolean().optional().describe('Include backlinks (default: true)'),
      include_related: z.boolean().optional().describe('Include related posts (default: true)'),
    },
    async (input) => {
      const graph = buildLiveGraph(contentDir, collection);
      const result = readPost(input, graph);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  // ── search ────────────────────────────────────────────────────
  server.tool(
    'search',
    'Search posts by title, description, and tags.',
    {
      query: z.string().describe('Search query'),
      limit: z.number().int().min(1).max(50).optional().describe('Max results (default: 10)'),
      collection: z.string().optional().describe('Filter by collection'),
    },
    async (input) => {
      const graph = buildLiveGraph(contentDir, collection);
      const results = search(input, graph);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(results.map((n) => ({
            slug: n.slug,
            title: n.title,
            description: n.description,
            date: n.date,
            tags: n.tags,
          })), null, 2),
        }],
      };
    },
  );

  // ── get_backlinks ─────────────────────────────────────────────
  server.tool(
    'get_backlinks',
    'Get all posts that link to a given post.',
    {
      slug: z.string().describe('Post slug'),
    },
    async ({ slug }) => {
      const graph = buildLiveGraph(contentDir, collection);
      const result = getBacklinks(slug, graph);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  // ── get_graph_neighborhood ────────────────────────────────────
  server.tool(
    'get_graph_neighborhood',
    'Get the local graph neighborhood around a post (nodes + edges within N hops).',
    {
      slug: z.string().describe('Post slug'),
      depth: z.number().int().min(1).max(4).optional().describe('Hop depth (default: 2, max: 4)'),
    },
    async ({ slug, depth }) => {
      const graph = buildLiveGraph(contentDir, collection);
      const result = getGraphNeighborhood(slug, depth, graph);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  // ── suggest_links ─────────────────────────────────────────────
  server.tool(
    'suggest_links',
    'Analyze content and suggest existing posts that should be wikilinked.',
    {
      content: z.string().describe('Markdown content to analyze'),
    },
    async ({ content }) => {
      const graph = buildLiveGraph(contentDir, collection);
      const result = suggestLinks(content, graph);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  // ── get_orphans ───────────────────────────────────────────────
  server.tool(
    'get_orphans',
    'Get posts with no incoming or outgoing links.',
    {
      collection: z.string().optional().describe('Filter by collection'),
    },
    async ({ collection: col }) => {
      const graph = buildLiveGraph(contentDir, collection);
      const result = getOrphans(col, graph);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  // ── get_recent ────────────────────────────────────────────────
  server.tool(
    'get_recent',
    'Get the most recent posts by date.',
    {
      n: z.number().int().min(1).max(50).optional().describe('Number of posts (default: 10)'),
      collection: z.string().optional().describe('Filter by collection'),
    },
    async ({ n, collection: col }) => {
      const graph = buildLiveGraph(contentDir, collection);
      const result = getRecent(n, col, graph);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  // ── connect + start ───────────────────────────────────────────
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
