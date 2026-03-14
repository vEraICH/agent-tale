/**
 * Astro integration for Agent-Tale.
 *
 * Hooks into the Astro build pipeline to:
 * 1. Scan content directory for .md/.mdx files
 * 2. Build the content graph (nodes + edges)
 * 3. Inject a Vite plugin that provides `agent-tale:graph` virtual module
 *
 * Usage in astro.config.mjs:
 *   import agentTale from '@agent-tale/astro-integration';
 *   export default defineConfig({
 *     integrations: [agentTale({ contentDir: './content' })],
 *   });
 */

import type { AstroIntegration } from 'astro';
import { buildGraph, createGraph } from '@agent-tale/core';
import { agentTaleVitePlugin } from './vite-plugin.js';

export interface AgentTaleOptions {
  /** Path to content directory (relative to project root). Defaults to './src/content/posts' */
  contentDir?: string;
  /** Collection name. Defaults to 'posts' */
  collection?: string;
}

export default function agentTaleIntegration(
  options: AgentTaleOptions = {},
): AstroIntegration {
  const {
    contentDir = './src/content/posts',
    collection = 'posts',
  } = options;

  return {
    name: 'agent-tale',
    hooks: {
      'astro:config:setup'({ updateConfig, config, logger }) {
        // Resolve content directory relative to project root
        const resolvedDir = new URL(contentDir + '/', config.root).pathname
          // Remove leading slash on Windows paths like /D:/...
          .replace(/^\/([A-Z]:)/, '$1');

        logger.info(`Scanning content in ${resolvedDir}`);

        // Build the graph from .md files
        const result = buildGraph({
          contentDir: resolvedDir,
          collection,
        });

        // Report errors
        for (const error of result.errors) {
          if (error.type === 'broken-link') {
            logger.warn(`${error.file}: ${error.message}`);
          } else {
            logger.error(`${error.file}: ${error.message}`);
          }
        }

        // Create traversable graph
        const graph = createGraph(result.nodes, result.edges);
        const stats = graph.getStats();

        logger.info(
          `Graph built: ${stats.nodeCount} nodes, ${stats.edgeCount} edges, ${stats.orphanCount} orphans, ${stats.clusters} clusters`,
        );

        // Inject Vite plugin for virtual module
        updateConfig({
          vite: {
            plugins: [agentTaleVitePlugin({ graph })],
          },
        });
      },
    },
  };
}
