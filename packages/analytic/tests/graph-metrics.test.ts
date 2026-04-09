import { describe, it, expect } from 'vitest';
import { computeGraphMetrics, type GraphInput } from '../src/graph-metrics.js';

// --- test helpers ---

function makeEdge(source: string, target: string) {
  return { source, target };
}

function makeGraph(slugs: string[], rawEdges: { source: string; target: string }[]): GraphInput {
  const nodes = new Map(
    slugs.map(slug => [slug, {
      slug,
      title: slug,
      inDegree: rawEdges.filter(e => e.target === slug).length,
      outDegree: rawEdges.filter(e => e.source === slug).length,
    }]),
  );
  return { nodes, edges: rawEdges };
}

// --- tests ---

describe('computeGraphMetrics', () => {
  it('returns zeros for an empty graph', () => {
    const metrics = computeGraphMetrics(makeGraph([], []));
    expect(metrics.nodeCount).toBe(0);
    expect(metrics.edgeCount).toBe(0);
    expect(metrics.connectivity).toBe(0);
    expect(metrics.orphanCount).toBe(0);
    expect(metrics.orphanRate).toBe(0);
    expect(metrics.clusterCount).toBe(0);
    expect(metrics.topCentralNodes).toHaveLength(0);
    expect(metrics.bridgeNodes).toHaveLength(0);
    expect(metrics.diameter).toBeNull();
  });

  it('counts nodes and edges', () => {
    const graph = makeGraph(
      ['a', 'b', 'c'],
      [makeEdge('a', 'b'), makeEdge('b', 'c')],
    );
    const metrics = computeGraphMetrics(graph);
    expect(metrics.nodeCount).toBe(3);
    expect(metrics.edgeCount).toBe(2);
  });

  it('identifies orphan nodes (no inbound edges)', () => {
    const graph = makeGraph(
      ['orphan', 'linked'],
      [makeEdge('orphan', 'linked')],
    );
    const metrics = computeGraphMetrics(graph);
    // 'orphan' has no inbound edges; 'linked' has one
    expect(metrics.orphanCount).toBe(1);
    expect(metrics.orphanRate).toBeCloseTo(0.5);
  });

  it('computes connectivity = 1 for a fully connected graph', () => {
    const graph = makeGraph(
      ['a', 'b', 'c'],
      [makeEdge('a', 'b'), makeEdge('b', 'c'), makeEdge('c', 'a')],
    );
    const metrics = computeGraphMetrics(graph);
    expect(metrics.connectivity).toBe(1);
  });

  it('computes connectivity < 1 for a disconnected graph', () => {
    const graph = makeGraph(
      ['a', 'b', 'c', 'd'],
      [makeEdge('a', 'b')], // c and d are isolated from a/b
    );
    const metrics = computeGraphMetrics(graph);
    // Largest WCC is {a, b} = 2 nodes; total = 4; connectivity = 0.5
    expect(metrics.connectivity).toBeCloseTo(0.5);
  });

  it('computes diameter for a linear chain', () => {
    const graph = makeGraph(
      ['a', 'b', 'c', 'd'],
      [makeEdge('a', 'b'), makeEdge('b', 'c'), makeEdge('c', 'd')],
    );
    const metrics = computeGraphMetrics(graph);
    expect(metrics.diameter).toBe(3); // a→b→c→d
  });

  it('returns null diameter for a single node', () => {
    const graph = makeGraph(['solo'], []);
    const metrics = computeGraphMetrics(graph);
    expect(metrics.diameter).toBeNull();
  });

  it('returns at most 5 central nodes', () => {
    const slugs = Array.from({ length: 10 }, (_, i) => `n${i}`);
    const edges = slugs.slice(1).map((_, i) => makeEdge(`n${i}`, `n${i + 1}`));
    const graph = makeGraph(slugs, edges);
    const metrics = computeGraphMetrics(graph);
    expect(metrics.topCentralNodes.length).toBeLessThanOrEqual(5);
    expect(metrics.bridgeNodes.length).toBeLessThanOrEqual(5);
  });
});
