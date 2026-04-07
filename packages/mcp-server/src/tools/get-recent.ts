import type { Graph } from '@agent-tale/core';

export function getRecent(n: number = 10, collection: string | undefined, graph: Graph) {
  let nodes = Array.from(graph.nodes.values()).filter((node) => node.date);

  if (collection) {
    nodes = nodes.filter((node) => node.collection === collection);
  }

  return nodes
    .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())
    .slice(0, n)
    .map((node) => ({
      slug: node.slug,
      title: node.title,
      description: node.description,
      date: node.date,
      tags: node.tags,
      agent: node.agent,
      type: node.type,
    }));
}
