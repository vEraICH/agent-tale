#!/usr/bin/env node
/**
 * @agent-tale/mcp-server — CLI entry point
 *
 * Usage:
 *   agent-tale-mcp --content ./content/posts
 *   agent-tale-mcp --content ./content/posts --collection posts
 */

import { resolve } from 'node:path';
import { startServer } from './server.js';

const args = process.argv.slice(2);

function getArg(flag: string): string | undefined {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : undefined;
}

const contentArg = getArg('--content');
const collection = getArg('--collection') ?? 'posts';

if (!contentArg) {
  console.error('Usage: agent-tale-mcp --content <path> [--collection <name>]');
  process.exit(1);
}

const contentDir = resolve(process.cwd(), contentArg);

startServer({ contentDir, collection }).catch((err) => {
  console.error('MCP server error:', err);
  process.exit(1);
});
