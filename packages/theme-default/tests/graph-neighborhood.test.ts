/**
 * Neighborhood / BFS tests.
 */

import { describe, it, expect } from 'vitest';
import { bfs, createFocus, getFocusOpacity, getEdgeFocusOpacity } from '../src/components/graph/neighborhood';
import { FOCUS_BG_OPACITY } from '../src/components/graph/constants';

function makeAdj(edges: [string, string][]): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  for (const [a, b] of edges) {
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    adj.get(a)!.add(b);
    adj.get(b)!.add(a);
  }
  return adj;
}

describe('bfs', () => {
  it('returns only start node at depth 0', () => {
    const adj = makeAdj([['a', 'b'], ['b', 'c']]);
    const result = bfs('a', adj, 0);
    expect(result.size).toBe(1);
    expect(result.get('a')).toBe(0);
  });

  it('reaches immediate neighbors at depth 1', () => {
    const adj = makeAdj([['a', 'b'], ['a', 'c'], ['b', 'd']]);
    const result = bfs('a', adj, 1);
    expect(result.size).toBe(3); // a, b, c
    expect(result.get('b')).toBe(1);
    expect(result.get('c')).toBe(1);
    expect(result.has('d')).toBe(false);
  });

  it('reaches two hops at depth 2', () => {
    const adj = makeAdj([['a', 'b'], ['b', 'c'], ['c', 'd']]);
    const result = bfs('a', adj, 2);
    expect(result.size).toBe(3); // a, b, c
    expect(result.get('c')).toBe(2);
    expect(result.has('d')).toBe(false);
  });

  it('handles cycles', () => {
    const adj = makeAdj([['a', 'b'], ['b', 'c'], ['c', 'a']]);
    const result = bfs('a', adj, 10);
    expect(result.size).toBe(3);
    expect(result.get('a')).toBe(0);
    expect(result.get('b')).toBe(1);
    expect(result.get('c')).toBe(1);
  });

  it('handles disconnected nodes', () => {
    const adj = makeAdj([['a', 'b']]);
    adj.set('z', new Set()); // isolated node
    const result = bfs('a', adj, 5);
    expect(result.has('z')).toBe(false);
  });
});

describe('createFocus', () => {
  it('creates focus state with depthMap', () => {
    const adj = makeAdj([['a', 'b'], ['b', 'c']]);
    const focus = createFocus('a', adj, 2);
    expect(focus.slug).toBe('a');
    expect(focus.depth).toBe(2);
    expect(focus.depthMap.get('a')).toBe(0);
    expect(focus.depthMap.get('c')).toBe(2);
  });
});

describe('getFocusOpacity', () => {
  it('returns 1.0 when no focus', () => {
    expect(getFocusOpacity('x', null)).toBe(1.0);
  });

  it('returns 1.0 for focal node', () => {
    const adj = makeAdj([['a', 'b']]);
    const focus = createFocus('a', adj, 2);
    expect(getFocusOpacity('a', focus)).toBe(1.0);
  });

  it('returns background opacity for unreachable nodes', () => {
    const adj = makeAdj([['a', 'b']]);
    adj.set('z', new Set());
    const focus = createFocus('a', adj, 1);
    expect(getFocusOpacity('z', focus)).toBe(FOCUS_BG_OPACITY);
  });
});

describe('getEdgeFocusOpacity', () => {
  it('returns 1.0 when no focus', () => {
    expect(getEdgeFocusOpacity('a', 'b', null)).toBe(1.0);
  });

  it('returns min of endpoint opacities', () => {
    const adj = makeAdj([['a', 'b'], ['b', 'c']]);
    const focus = createFocus('a', adj, 2);
    // a→b: both in focus (depth 0 and 1) → min(1.0, 1.0) = 1.0
    expect(getEdgeFocusOpacity('a', 'b', focus)).toBe(1.0);
  });
});
