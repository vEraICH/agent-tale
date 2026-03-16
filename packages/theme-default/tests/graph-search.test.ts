/**
 * Search logic tests.
 */

import { describe, it, expect } from 'vitest';
import {
  createSearchState,
  runSearch,
  isSearchActive,
  getFirstMatch,
} from '../src/components/graph/search';
import type { SimNode } from '../src/components/graph/types';

function makeNode(overrides: Partial<SimNode> = {}): SimNode {
  return {
    slug: 'test',
    title: 'Test',
    tags: [],
    agent: null,
    radius: 8,
    degree: 0,
    nodeType: 'default',
    opacity: 1,
    targetOpacity: 1,
    glowIntensity: 0.5,
    targetGlowIntensity: 0.5,
    x: 0,
    y: 0,
    ...overrides,
  };
}

describe('createSearchState', () => {
  it('starts empty', () => {
    const s = createSearchState();
    expect(s.query).toBe('');
    expect(s.matches.size).toBe(0);
  });
});

describe('isSearchActive', () => {
  it('returns false for empty query', () => {
    expect(isSearchActive(createSearchState())).toBe(false);
  });

  it('returns false for whitespace-only query', () => {
    expect(isSearchActive({ query: '   ', matches: new Set() })).toBe(false);
  });

  it('returns true for non-empty query', () => {
    expect(isSearchActive({ query: 'test', matches: new Set() })).toBe(true);
  });
});

describe('runSearch', () => {
  const nodes = [
    makeNode({ slug: 'digital-gardens', title: 'Digital Gardens', tags: ['concept', 'vision'] }),
    makeNode({ slug: 'devlog-1-1', title: 'Devlog: First Steps', tags: ['devlog'] }),
    makeNode({ slug: 'architecture', title: 'Architecture Overview', tags: ['concept', 'reference'] }),
  ];

  it('returns empty matches for empty query', () => {
    const result = runSearch(nodes, '');
    expect(result.matches.size).toBe(0);
  });

  it('matches by title substring (case-insensitive)', () => {
    const result = runSearch(nodes, 'garden');
    expect(result.matches.has('digital-gardens')).toBe(true);
    expect(result.matches.size).toBe(1);
  });

  it('matches by slug', () => {
    const result = runSearch(nodes, 'devlog-1');
    expect(result.matches.has('devlog-1-1')).toBe(true);
  });

  it('matches by tag', () => {
    const result = runSearch(nodes, 'vision');
    expect(result.matches.has('digital-gardens')).toBe(true);
    expect(result.matches.size).toBe(1);
  });

  it('matches multiple nodes', () => {
    const result = runSearch(nodes, 'concept');
    // "concept" is a tag on digital-gardens and architecture
    expect(result.matches.size).toBe(2);
  });

  it('is case-insensitive', () => {
    const result = runSearch(nodes, 'ARCHITECTURE');
    expect(result.matches.has('architecture')).toBe(true);
  });
});

describe('getFirstMatch', () => {
  const nodes = [
    makeNode({ slug: 'a', title: 'Alpha', x: 10, y: 20 }),
    makeNode({ slug: 'b', title: 'Beta', x: 30, y: 40 }),
  ];

  it('returns null when search is not active', () => {
    const state = createSearchState();
    expect(getFirstMatch(state, nodes)).toBeNull();
  });

  it('returns first matching node', () => {
    const state = runSearch(nodes, 'alpha');
    const match = getFirstMatch(state, nodes);
    expect(match).not.toBeNull();
    expect(match!.slug).toBe('a');
  });

  it('returns null when no nodes match', () => {
    const state = runSearch(nodes, 'zzzzz');
    expect(getFirstMatch(state, nodes)).toBeNull();
  });
});
