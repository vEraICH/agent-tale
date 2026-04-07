import type { Graph } from '@agent-tale/core';

export function getBacklinks(slug: string, graph: Graph) {
  const node = graph.nodes.get(slug);
  if (!node) return { error: `Post "${slug}" not found.` };

  return graph.getBacklinks(slug).map((n) => ({
    slug: n.slug,
    title: n.title,
    description: n.description,
    tags: n.tags,
  }));
}
