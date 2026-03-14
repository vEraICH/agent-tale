/**
 * Graph traversal — backlinks, related posts, orphans, stats.
 *
 * Pure functions that operate on the graph data produced by the builder.
 */

import type { GraphNode, GraphEdge, Graph } from './types.js';

export interface GraphStats {
  nodeCount: number;
  edgeCount: number;
  orphanCount: number;
  clusters: number;
}

/**
 * Create a full Graph implementation from nodes and edges.
 */
export function createGraph(
  nodes: Map<string, GraphNode>,
  edges: GraphEdge[],
): Graph {
  // Pre-build adjacency indices for fast lookups
  const outgoing = new Map<string, GraphEdge[]>();
  const incoming = new Map<string, GraphEdge[]>();

  for (const edge of edges) {
    if (!outgoing.has(edge.source)) outgoing.set(edge.source, []);
    outgoing.get(edge.source)!.push(edge);

    if (!incoming.has(edge.target)) incoming.set(edge.target, []);
    incoming.get(edge.target)!.push(edge);
  }

  return {
    nodes,
    edges,

    getBacklinks(slug: string): GraphNode[] {
      const inEdges = incoming.get(slug) ?? [];
      return inEdges
        .map((e) => nodes.get(e.source))
        .filter((n): n is GraphNode => n !== undefined);
    },

    getOutlinks(slug: string): GraphNode[] {
      const outEdges = outgoing.get(slug) ?? [];
      return outEdges
        .map((e) => nodes.get(e.target))
        .filter((n): n is GraphNode => n !== undefined);
    },

    getRelated(slug: string, depth = 2): GraphNode[] {
      const visited = new Set<string>([slug]);
      const scored = new Map<string, number>();

      // BFS up to `depth` hops
      let frontier = [slug];
      for (let hop = 1; hop <= depth && frontier.length > 0; hop++) {
        const weight = hop === 1 ? 1.0 : 0.5 / (hop - 1);
        const nextFrontier: string[] = [];

        for (const current of frontier) {
          // Outgoing links
          for (const edge of outgoing.get(current) ?? []) {
            if (!visited.has(edge.target) && nodes.has(edge.target)) {
              visited.add(edge.target);
              scored.set(edge.target, (scored.get(edge.target) ?? 0) + weight);
              nextFrontier.push(edge.target);
            }
          }
          // Incoming links (backlinks)
          for (const edge of incoming.get(current) ?? []) {
            if (!visited.has(edge.source) && nodes.has(edge.source)) {
              visited.add(edge.source);
              scored.set(edge.source, (scored.get(edge.source) ?? 0) + weight);
              nextFrontier.push(edge.source);
            }
          }
        }

        frontier = nextFrontier;
      }

      // Add tag-based scoring (weight 0.3)
      const sourceNode = nodes.get(slug);
      if (sourceNode && sourceNode.tags.length > 0) {
        for (const [nodeSlug, node] of nodes) {
          if (nodeSlug === slug) continue;
          const sharedTags = node.tags.filter((t) =>
            sourceNode.tags.includes(t),
          ).length;
          if (sharedTags > 0) {
            scored.set(
              nodeSlug,
              (scored.get(nodeSlug) ?? 0) + sharedTags * 0.3,
            );
          }
        }
      }

      // Sort by score descending, return top results
      return Array.from(scored.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([s]) => nodes.get(s)!)
        .filter(Boolean);
    },

    getOrphans(): GraphNode[] {
      return Array.from(nodes.values()).filter(
        (node) => node.inDegree === 0 && node.outDegree === 0,
      );
    },

    getStats(): GraphStats {
      const orphanCount = Array.from(nodes.values()).filter(
        (n) => n.inDegree === 0 && n.outDegree === 0,
      ).length;

      // Compute connected components (clusters)
      const visited = new Set<string>();
      let clusters = 0;

      for (const slug of nodes.keys()) {
        if (visited.has(slug)) continue;
        clusters++;
        // BFS to mark all connected nodes
        const queue = [slug];
        while (queue.length > 0) {
          const current = queue.pop()!;
          if (visited.has(current)) continue;
          visited.add(current);

          for (const edge of outgoing.get(current) ?? []) {
            if (nodes.has(edge.target) && !visited.has(edge.target)) {
              queue.push(edge.target);
            }
          }
          for (const edge of incoming.get(current) ?? []) {
            if (nodes.has(edge.source) && !visited.has(edge.source)) {
              queue.push(edge.source);
            }
          }
        }
      }

      return {
        nodeCount: nodes.size,
        edgeCount: edges.length,
        orphanCount,
        clusters,
      };
    },
  };
}
