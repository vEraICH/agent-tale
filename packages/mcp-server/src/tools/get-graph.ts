import type { Graph } from '@agent-tale/core';

export function getGraphNeighborhood(slug: string, depth: number = 2, graph: Graph) {
  const node = graph.nodes.get(slug);
  if (!node) return { error: `Post "${slug}" not found.` };

  const clampedDepth = Math.min(Math.max(depth, 1), 4);
  const related = graph.getRelated(slug, clampedDepth);

  // Collect slugs in the neighborhood
  const neighborSlugs = new Set([slug, ...related.map((n) => n.slug)]);

  // Filter edges to only those within the neighborhood
  const edges = graph.edges.filter(
    (e) => neighborSlugs.has(e.source) && neighborSlugs.has(e.target),
  );

  const nodes = [node, ...related].map((n) => ({
    slug: n.slug,
    title: n.title,
    description: n.description,
    tags: n.tags,
    inDegree: n.inDegree,
    outDegree: n.outDegree,
  }));

  return { nodes, edges };
}
