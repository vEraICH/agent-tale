export const prerender = false;

import type { APIRoute } from 'astro';
import { join } from 'node:path';
import { AnalyticEventSchema, getStore } from '@agent-tale/analytic';

// ── Simple in-memory rate limiter (60 events / IP / minute) ──
const _limits = new Map<string, { n: number; resetAt: number }>();

function allowed(ip: string, limit = 60, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = _limits.get(ip);
  if (!entry || now > entry.resetAt) {
    _limits.set(ip, { n: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.n >= limit) return false;
  entry.n++;
  return true;
}

// Prune stale entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of _limits) if (now > v.resetAt) _limits.delete(k);
}, 10 * 60 * 1000).unref?.();

const DB_PATH = process.env.ANALYTICS_DB_PATH ?? join(process.cwd(), 'data', 'analytics.db');

export const POST: APIRoute = async ({ request }) => {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('cf-connecting-ip') ??
    'unknown';

  if (!allowed(ip)) {
    return new Response(null, { status: 429 });
  }

  let body: unknown;
  try {
    const text = await request.text();
    if (!text) return new Response(null, { status: 400 });
    body = JSON.parse(text);
  } catch (err) {
    console.log('[analytics] parse error:', err);
    return new Response(null, { status: 400 });
  }

  const parsed = AnalyticEventSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(null, { status: 422 });
  }

  try {
    getStore(DB_PATH).insert(parsed.data);
  } catch (err) {
    console.error('[analytics] write error:', err);
    return new Response(null, { status: 500 });
  }

  return new Response(null, { status: 204 });
};
