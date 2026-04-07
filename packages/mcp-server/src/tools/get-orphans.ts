import type { Graph } from '@agent-tale/core';

export function getOrphans(collection: string | undefined, graph: Graph) {
  let orphans = graph.getOrphans();
  if (collection) {
    orphans = orphans.filter((n) => n.collection === collection);
  }
  return orphans.map((n) => ({
    slug: n.slug,
    title: n.title,
    description: n.description,
    tags: n.tags,
    date: n.date,
  }));
}
