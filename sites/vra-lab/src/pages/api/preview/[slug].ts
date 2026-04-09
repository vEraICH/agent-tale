export const prerender = false;

import type { APIRoute } from 'astro';
import { getNode } from 'agent-tale:graph';
import { readPost } from '../../../lib/content-fs.js';
import { json } from '../../../lib/admin-auth.js';

function extractExcerpt(content: string, wordCount = 80): string {
  const stripped = content
    .replace(/^#{1,6}\s+.*/gm, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1')
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, '')
    .replace(/[*_]{1,2}([^*_\n]+)[*_]{1,2}/g, '$1')
    .replace(/^[-*+>]\s+/gm, '')
    .replace(/\n+/g, ' ')
    .trim();

  const words = stripped.split(/\s+/).filter(Boolean);
  const slice = words.slice(0, wordCount).join(' ');
  return words.length > wordCount ? slice + '…' : slice;
}

export const GET: APIRoute = ({ params }) => {
  const { slug } = params;
  if (!slug) return json({ error: 'Missing slug' }, 400);

  const node = getNode(slug);
  if (!node) return json({ error: 'Not found' }, 404);

  const post = readPost(slug);
  const excerpt = post ? extractExcerpt(post.content) : (node.title ?? '');
  const connections = node.inDegree + node.outDegree;

  return json({
    title: node.title,
    excerpt,
    tags: node.tags ?? [],
    connections,
  });
};
