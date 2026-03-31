/**
 * GET /api/graph — returns the full graph snapshot (nodes, edges, stats, orphans).
 *
 * This is a snapshot built at dev-server startup / build time.
 * It reflects content as of the last Astro restart, not live disk state.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { nodes, edges, stats, orphans } from 'agent-tale:graph';
import { json } from '../../lib/admin-auth.js';

export const GET: APIRoute = () => {
  return json({ nodes, edges, stats, orphans });
};
