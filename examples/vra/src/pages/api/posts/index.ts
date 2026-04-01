export const prerender = false;

import type { APIRoute } from 'astro';
import { nodes } from 'agent-tale:graph';
import { writePost, postExists, isValidSlug } from '../../../lib/content-fs.js';
import { checkAuth, unauthorized, adminNotConfigured, isAdminConfigured, json } from '../../../lib/admin-auth.js';

export const GET: APIRoute = () => json({ posts: nodes });

export const POST: APIRoute = async ({ request }) => {
  if (!isAdminConfigured()) return adminNotConfigured();
  if (!checkAuth(request)) return unauthorized();

  let body: unknown;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }

  const { slug, frontmatter, content } = body as { slug?: unknown; frontmatter?: unknown; content?: unknown };

  if (!isValidSlug(slug)) return json({ error: 'slug is required and must match /^[a-z0-9][a-z0-9-]*$/' }, 400);
  if (postExists(slug)) return json({ error: `Post "${slug}" already exists` }, 409);
  if (!frontmatter || typeof frontmatter !== 'object' || Array.isArray(frontmatter)) return json({ error: 'frontmatter must be an object' }, 400);

  writePost(slug, frontmatter as Record<string, unknown>, typeof content === 'string' ? content : '');
  return json({ slug, created: true }, 201);
};
