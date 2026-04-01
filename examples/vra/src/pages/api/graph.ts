export const prerender = false;

import type { APIRoute } from 'astro';
import { nodes, edges, stats, orphans } from 'agent-tale:graph';
import { json } from '../../lib/admin-auth.js';

export const GET: APIRoute = () => json({ nodes, edges, stats, orphans });
