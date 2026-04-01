export const prerender = false;

import type { APIRoute } from 'astro';
import { readPost, writePost, deletePost, postExists } from '../../../lib/content-fs.js';
import { checkAuth, unauthorized, adminNotConfigured, isAdminConfigured, json } from '../../../lib/admin-auth.js';

export const GET: APIRoute = ({ params }) => {
  const { slug } = params;
  if (!slug) return json({ error: 'Missing slug' }, 400);
  const post = readPost(slug);
  if (!post) return json({ error: 'Not found' }, 404);
  return json(post);
};

export const PUT: APIRoute = async ({ params, request }) => {
  if (!isAdminConfigured()) return adminNotConfigured();
  if (!checkAuth(request)) return unauthorized();

  const { slug } = params;
  if (!slug) return json({ error: 'Missing slug' }, 400);
  if (!postExists(slug)) return json({ error: 'Not found' }, 404);

  let body: unknown;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }

  const { frontmatter, content } = body as { frontmatter?: unknown; content?: unknown };
  if (!frontmatter || typeof frontmatter !== 'object' || Array.isArray(frontmatter)) return json({ error: 'frontmatter must be an object' }, 400);

  writePost(slug, frontmatter as Record<string, unknown>, typeof content === 'string' ? content : '');
  return json({ slug, updated: true });
};

export const DELETE: APIRoute = ({ params, request }) => {
  if (!isAdminConfigured()) return adminNotConfigured();
  if (!checkAuth(request)) return unauthorized();

  const { slug } = params;
  if (!slug) return json({ error: 'Missing slug' }, 400);
  const deleted = deletePost(slug);
  if (!deleted) return json({ error: 'Not found' }, 404);
  return json({ slug, deleted: true });
};
