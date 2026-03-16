/**
 * Neighborhood — BFS from a focal node, depth-based opacity.
 *
 * Single-click a node → BFS to configurable depth N.
 * Depth 0-1: fully opaque, depth 2: dim, depth 3+: ghost.
 */

import type { FocusState, SimNode } from './types';
import { DEPTH_OPACITY, FOCUS_BG_OPACITY, FOCUS_DEFAULT_DEPTH } from './constants';

/**
 * BFS from a start slug up to maxDepth.
 * Returns a Map<slug, depth> for all reachable nodes.
 */
export function bfs(
  startSlug: string,
  adjacency: Map<string, Set<string>>,
  maxDepth: number,
): Map<string, number> {
  const depthMap = new Map<string, number>();
  depthMap.set(startSlug, 0);

  const queue: string[] = [startSlug];
  let head = 0;

  while (head < queue.length) {
    const current = queue[head++];
    const currentDepth = depthMap.get(current)!;
    if (currentDepth >= maxDepth) continue;

    const neighbors = adjacency.get(current);
    if (!neighbors) continue;

    for (const neighbor of neighbors) {
      if (!depthMap.has(neighbor)) {
        depthMap.set(neighbor, currentDepth + 1);
        queue.push(neighbor);
      }
    }
  }

  return depthMap;
}

/** Create a focus state from a clicked node. */
export function createFocus(
  slug: string,
  adjacency: Map<string, Set<string>>,
  depth = FOCUS_DEFAULT_DEPTH,
): FocusState {
  return {
    slug,
    depth,
    depthMap: bfs(slug, adjacency, depth),
  };
}

/** Get the target opacity for a node given the current focus state. */
export function getFocusOpacity(
  nodeSlug: string,
  focus: FocusState | null,
): number {
  if (!focus) return 1.0;
  const depth = focus.depthMap.get(nodeSlug);
  if (depth == null) return FOCUS_BG_OPACITY;
  return DEPTH_OPACITY[depth] ?? FOCUS_BG_OPACITY;
}

/** Get target opacity for an edge given focus state. */
export function getEdgeFocusOpacity(
  sourceSlug: string,
  targetSlug: string,
  focus: FocusState | null,
): number {
  if (!focus) return 1.0;
  const sd = focus.depthMap.get(sourceSlug);
  const td = focus.depthMap.get(targetSlug);
  if (sd == null || td == null) return FOCUS_BG_OPACITY;
  // Edge opacity = min of the two endpoint opacities
  const so = DEPTH_OPACITY[sd] ?? FOCUS_BG_OPACITY;
  const to = DEPTH_OPACITY[td] ?? FOCUS_BG_OPACITY;
  return Math.min(so, to);
}

/** Update focus depth and recompute BFS. */
export function updateFocusDepth(
  focus: FocusState,
  adjacency: Map<string, Set<string>>,
  newDepth: number,
): FocusState {
  return createFocus(focus.slug, adjacency, newDepth);
}
