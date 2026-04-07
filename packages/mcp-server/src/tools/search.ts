import type { Graph, GraphNode } from '@agent-tale/core';

export interface SearchInput {
  query: string;
  limit?: number;
  collection?: string;
}

export function search(input: SearchInput, graph: Graph): GraphNode[] {
  const { query, limit = 10, collection } = input;
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  let nodes = Array.from(graph.nodes.values());

  if (collection) {
    nodes = nodes.filter((n) => n.collection === collection);
  }

  // Score each node by how many query terms appear in title, description, and tags
  const scored = nodes
    .map((node) => {
      const haystack = [
        node.title,
        node.description ?? '',
        node.tags.join(' '),
        node.agent ?? '',
      ].join(' ').toLowerCase();

      const score = terms.reduce((acc, term) => {
        if (node.title.toLowerCase().includes(term)) return acc + 3;
        if ((node.description ?? '').toLowerCase().includes(term)) return acc + 2;
        if (node.tags.some((t) => t.toLowerCase().includes(term))) return acc + 2;
        if (haystack.includes(term)) return acc + 1;
        return acc;
      }, 0);

      return { node, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ node }) => node);

  return scored;
}
