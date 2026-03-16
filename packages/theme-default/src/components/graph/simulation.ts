/**
 * Simulation — d3-force wrapper with filter-aware forces.
 *
 * Uses forceX/forceY instead of forceCenter for more stable behavior.
 * Warms up silently (N ticks before first render) to avoid the
 * "explosion from origin" effect.
 */

import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceX,
  forceY,
  type Simulation,
} from 'd3-force';
import type { SimNode, SimLink, GraphNodeData, GraphEdgeData } from './types';
import {
  SIM_LINK_DISTANCE,
  SIM_LINK_STRENGTH,
  SIM_CHARGE_STRENGTH,
  SIM_COLLIDE_PADDING,
  SIM_ALPHA_DECAY,
  SIM_ALPHA_MIN,
  SIM_WARMUP_TICKS,
  SIM_POSITION_STRENGTH,
  NODE_MIN_RADIUS,
  NODE_MAX_RADIUS,
  NODE_RADIUS_BASE,
  NODE_RADIUS_PER_DEGREE,
} from './constants';

function classifyNodeType(tags: string[]): SimNode['nodeType'] {
  if (tags.includes('lesson')) return 'lesson';
  if (tags.includes('devlog')) return 'devlog';
  if (tags.includes('concept')) return 'concept';
  return 'default';
}

export function buildSimData(
  nodes: GraphNodeData[],
  edges: GraphEdgeData[],
): { simNodes: SimNode[]; simLinks: SimLink[] } {
  const simNodes: SimNode[] = nodes.map((n) => {
    const degree = n.inDegree + n.outDegree;
    return {
      slug: n.slug,
      title: n.title,
      tags: n.tags,
      agent: n.agent,
      degree,
      radius: Math.max(NODE_MIN_RADIUS, Math.min(NODE_MAX_RADIUS, NODE_RADIUS_BASE + degree * NODE_RADIUS_PER_DEGREE)),
      nodeType: classifyNodeType(n.tags),
      opacity: 1,
      targetOpacity: 1,
      glowIntensity: 0.5,
      targetGlowIntensity: 0.5,
      x: undefined,
      y: undefined,
    };
  });

  const nodeMap = new Map(simNodes.map((n) => [n.slug, n]));
  const simLinks: SimLink[] = edges
    .filter((e) => nodeMap.has(e.source) && nodeMap.has(e.target))
    .map((e) => ({ source: e.source, target: e.target }));

  return { simNodes, simLinks };
}

export function createSimulation(
  simNodes: SimNode[],
  simLinks: SimLink[],
  onTick?: () => void,
): Simulation<SimNode, SimLink> {
  const sim = forceSimulation<SimNode>(simNodes)
    .force(
      'link',
      forceLink<SimNode, SimLink>(simLinks)
        .id((d) => d.slug)
        .distance(SIM_LINK_DISTANCE)
        .strength(SIM_LINK_STRENGTH),
    )
    .force('charge', forceManyBody<SimNode>().strength(SIM_CHARGE_STRENGTH))
    .force('x', forceX<SimNode>(0).strength(SIM_POSITION_STRENGTH))
    .force('y', forceY<SimNode>(0).strength(SIM_POSITION_STRENGTH))
    .force('collide', forceCollide<SimNode>().radius((d) => d.radius + SIM_COLLIDE_PADDING))
    .alphaDecay(SIM_ALPHA_DECAY)
    .alphaMin(SIM_ALPHA_MIN)
    .stop(); // We control ticking manually

  // Warm up — run ticks silently so nodes settle before first paint
  for (let i = 0; i < SIM_WARMUP_TICKS; i++) {
    sim.tick();
  }

  if (onTick) {
    sim.on('tick', onTick);
  }

  sim.restart();
  return sim;
}

/** Reheat simulation (e.g., after drag or filter change). */
export function reheat(sim: Simulation<SimNode, SimLink>, alpha = 0.3): void {
  sim.alpha(alpha).restart();
}

/** Build adjacency list from links for BFS / neighborhood. */
export function buildAdjacency(
  simNodes: SimNode[],
  simLinks: SimLink[],
): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  for (const n of simNodes) {
    adj.set(n.slug, new Set());
  }
  for (const link of simLinks) {
    const s = typeof link.source === 'string' ? link.source : link.source.slug;
    const t = typeof link.target === 'string' ? link.target : link.target.slug;
    adj.get(s)?.add(t);
    adj.get(t)?.add(s);
  }
  return adj;
}
