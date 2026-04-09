/** Minimal graph shape required by computeGraphMetrics. Structurally compatible with Graph from @agent-tale/core. */
export interface GraphInput {
  nodes: Map<string, { slug: string; title: string; inDegree: number; outDegree: number }>;
  edges: Array<{ source: string; target: string }>;
}

export interface CentralNode {
  slug: string;
  title: string;
  score: number;
}

export interface GraphMetrics {
  nodeCount: number;
  edgeCount: number;
  /** Fraction 0–1: nodes in the largest weakly-connected component / total. */
  connectivity: number;
  orphanCount: number;
  /** orphanCount / nodeCount */
  orphanRate: number;
  /** Number of weakly-connected components (community proxy). */
  clusterCount: number;
  /** Top-5 nodes by PageRank. */
  topCentralNodes: CentralNode[];
  /** Top-5 nodes by betweenness centrality (bridge nodes). */
  bridgeNodes: CentralNode[];
  /** Longest directed shortest path found by BFS sampling. Null for tiny or fully-disconnected graphs. */
  diameter: number | null;
}

// ── Adjacency helpers ──

function buildAdjacency(slugs: string[], edges: Array<{ source: string; target: string }>) {
  const out = new Map<string, string[]>();
  const inn = new Map<string, string[]>();
  for (const s of slugs) { out.set(s, []); inn.set(s, []); }
  for (const e of edges) {
    if (out.has(e.source) && out.has(e.target)) {
      out.get(e.source)!.push(e.target);
      inn.get(e.target)!.push(e.source);
    }
  }
  return { out, inn };
}

// ── Weakly-connected components ──

function computeWCC(slugs: string[], out: Map<string, string[]>, inn: Map<string, string[]>) {
  const visited = new Set<string>();
  const components: string[][] = [];

  for (const start of slugs) {
    if (visited.has(start)) continue;
    const component: string[] = [];
    const queue = [start];
    visited.add(start);
    while (queue.length > 0) {
      const node = queue.shift()!;
      component.push(node);
      for (const nb of [...(out.get(node) ?? []), ...(inn.get(node) ?? [])]) {
        if (!visited.has(nb)) {
          visited.add(nb);
          queue.push(nb);
        }
      }
    }
    components.push(component);
  }

  return components;
}

// ── PageRank (power iteration) ──

function computePageRank(
  slugs: string[],
  out: Map<string, string[]>,
  alpha = 0.85,
  maxIter = 100,
  tol = 1e-6,
): Record<string, number> {
  const n = slugs.length;
  if (n === 0) return {};

  const scores: Record<string, number> = {};
  for (const s of slugs) scores[s] = 1 / n;

  for (let iter = 0; iter < maxIter; iter++) {
    const next: Record<string, number> = {};
    for (const s of slugs) next[s] = (1 - alpha) / n;

    for (const s of slugs) {
      const links = out.get(s) ?? [];
      if (links.length === 0) {
        // Dangling node: spread rank evenly
        const share = (alpha * scores[s]) / n;
        for (const t of slugs) next[t] += share;
      } else {
        const share = (alpha * scores[s]) / links.length;
        for (const t of links) next[t] += share;
      }
    }

    let diff = 0;
    for (const s of slugs) diff += Math.abs(next[s] - scores[s]);
    for (const s of slugs) scores[s] = next[s];
    if (diff < tol) break;
  }

  return scores;
}

// ── Betweenness centrality (Brandes algorithm) ──

function computeBetweenness(
  slugs: string[],
  out: Map<string, string[]>,
): Record<string, number> {
  const n = slugs.length;
  const scores: Record<string, number> = {};
  for (const s of slugs) scores[s] = 0;

  for (const source of slugs) {
    const stack: string[] = [];
    const pred = new Map<string, string[]>();
    const sigma = new Map<string, number>();
    const dist = new Map<string, number>();

    for (const s of slugs) { pred.set(s, []); sigma.set(s, 0); dist.set(s, -1); }
    sigma.set(source, 1);
    dist.set(source, 0);

    const queue = [source];
    while (queue.length > 0) {
      const v = queue.shift()!;
      stack.push(v);
      for (const w of (out.get(v) ?? [])) {
        if (dist.get(w) === -1) {
          queue.push(w);
          dist.set(w, dist.get(v)! + 1);
        }
        if (dist.get(w) === dist.get(v)! + 1) {
          sigma.set(w, sigma.get(w)! + sigma.get(v)!);
          pred.get(w)!.push(v);
        }
      }
    }

    const delta = new Map<string, number>();
    for (const s of slugs) delta.set(s, 0);

    while (stack.length > 0) {
      const w = stack.pop()!;
      for (const v of (pred.get(w) ?? [])) {
        const coeff = (sigma.get(v)! / sigma.get(w)!) * (1 + delta.get(w)!);
        delta.set(v, delta.get(v)! + coeff);
      }
      if (w !== source) scores[w] += delta.get(w)!;
    }
  }

  // Normalize for directed graph
  if (n > 2) {
    const factor = 1 / ((n - 1) * (n - 2));
    for (const s of slugs) scores[s] *= factor;
  }

  return scores;
}

// ── BFS diameter ──

function computeDiameter(slugs: string[], out: Map<string, string[]>, sampleSize = 100): number | null {
  if (slugs.length < 2) return null;
  const sources = slugs.length <= sampleSize ? slugs : slugs.slice(0, sampleSize);
  let maxDist = 0;

  for (const start of sources) {
    const dist = new Map<string, number>([[start, 0]]);
    const queue = [start];
    while (queue.length > 0) {
      const node = queue.shift()!;
      const d = dist.get(node)!;
      for (const nb of (out.get(node) ?? [])) {
        if (!dist.has(nb)) {
          dist.set(nb, d + 1);
          queue.push(nb);
          if (d + 1 > maxDist) maxDist = d + 1;
        }
      }
    }
  }

  return maxDist > 0 ? maxDist : null;
}

// ── Public API ──

export function computeGraphMetrics(graph: GraphInput): GraphMetrics {
  const nodeValues = [...graph.nodes.values()];
  const slugs = nodeValues.map(n => n.slug);
  const nodeCount = slugs.length;
  const edgeCount = graph.edges.length;

  if (nodeCount === 0) {
    return {
      nodeCount: 0, edgeCount: 0, connectivity: 0,
      orphanCount: 0, orphanRate: 0, clusterCount: 0,
      topCentralNodes: [], bridgeNodes: [], diameter: null,
    };
  }

  const { out, inn } = buildAdjacency(slugs, graph.edges);

  const orphanCount = nodeValues.filter(n => n.inDegree === 0).length;
  const orphanRate = orphanCount / nodeCount;

  const wccs = computeWCC(slugs, out, inn);
  const largestCC = Math.max(...wccs.map(c => c.length));
  const connectivity = largestCC / nodeCount;
  const clusterCount = wccs.length;

  const diameter = computeDiameter(slugs, out);

  // PageRank
  const prScores = computePageRank(slugs, out);
  const topCentralNodes = Object.entries(prScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([slug, score]) => ({ slug, title: graph.nodes.get(slug)?.title ?? slug, score }));

  // Betweenness centrality
  const btScores = computeBetweenness(slugs, out);
  const bridgeNodes = Object.entries(btScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([slug, score]) => ({ slug, title: graph.nodes.get(slug)?.title ?? slug, score }));

  return {
    nodeCount, edgeCount, connectivity,
    orphanCount, orphanRate, clusterCount,
    topCentralNodes, bridgeNodes, diameter,
  };
}
