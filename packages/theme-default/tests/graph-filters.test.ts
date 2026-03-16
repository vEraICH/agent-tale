/**
 * Filter logic tests.
 */

import { describe, it, expect } from 'vitest';
import {
  createFilterState,
  toggleFilter,
  clearAllFilters,
  hasActiveFilters,
  nodePassesFilter,
  extractFilterOptions,
  getFilteredSlugs,
} from '../src/components/graph/filters';
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

describe('createFilterState', () => {
  it('starts with empty sets', () => {
    const fs = createFilterState();
    expect(fs.tags.size).toBe(0);
    expect(fs.agents.size).toBe(0);
    expect(fs.types.size).toBe(0);
  });
});

describe('toggleFilter', () => {
  it('adds value on first toggle', () => {
    const fs = toggleFilter(createFilterState(), 'tags', 'lesson');
    expect(fs.tags.has('lesson')).toBe(true);
  });

  it('removes value on second toggle', () => {
    let fs = toggleFilter(createFilterState(), 'tags', 'lesson');
    fs = toggleFilter(fs, 'tags', 'lesson');
    expect(fs.tags.has('lesson')).toBe(false);
  });

  it('does not mutate original state', () => {
    const original = createFilterState();
    toggleFilter(original, 'tags', 'lesson');
    expect(original.tags.size).toBe(0);
  });
});

describe('hasActiveFilters', () => {
  it('returns false for empty state', () => {
    expect(hasActiveFilters(createFilterState())).toBe(false);
  });

  it('returns true when tags are set', () => {
    const fs = toggleFilter(createFilterState(), 'tags', 'x');
    expect(hasActiveFilters(fs)).toBe(true);
  });
});

describe('clearAllFilters', () => {
  it('returns empty state', () => {
    let fs = toggleFilter(createFilterState(), 'tags', 'x');
    fs = toggleFilter(fs, 'agents', 'tim');
    fs = clearAllFilters();
    expect(hasActiveFilters(fs)).toBe(false);
  });
});

describe('nodePassesFilter', () => {
  it('passes all nodes when no filters active', () => {
    const node = makeNode();
    expect(nodePassesFilter(node, createFilterState())).toBe(true);
  });

  it('filters by tag', () => {
    const node = makeNode({ tags: ['graph', 'concept'] });
    const fs = toggleFilter(createFilterState(), 'tags', 'graph');
    expect(nodePassesFilter(node, fs)).toBe(true);
  });

  it('rejects node missing tag', () => {
    const node = makeNode({ tags: ['concept'] });
    const fs = toggleFilter(createFilterState(), 'tags', 'graph');
    expect(nodePassesFilter(node, fs)).toBe(false);
  });

  it('filters by agent', () => {
    const node = makeNode({ agent: 'tim' });
    const fs = toggleFilter(createFilterState(), 'agents', 'tim');
    expect(nodePassesFilter(node, fs)).toBe(true);
  });

  it('rejects node with no agent when agent filter active', () => {
    const node = makeNode({ agent: null });
    const fs = toggleFilter(createFilterState(), 'agents', 'tim');
    expect(nodePassesFilter(node, fs)).toBe(false);
  });

  it('filters by type', () => {
    const node = makeNode({ nodeType: 'devlog' });
    const fs = toggleFilter(createFilterState(), 'types', 'devlog');
    expect(nodePassesFilter(node, fs)).toBe(true);
  });

  it('applies AND logic across categories', () => {
    const node = makeNode({ tags: ['graph'], nodeType: 'devlog' });
    let fs = toggleFilter(createFilterState(), 'tags', 'graph');
    fs = toggleFilter(fs, 'types', 'lesson'); // node is devlog, not lesson
    expect(nodePassesFilter(node, fs)).toBe(false);
  });
});

describe('extractFilterOptions', () => {
  it('extracts unique tags, agents, and types', () => {
    const nodes = [
      makeNode({ tags: ['a', 'b'], agent: 'tim', nodeType: 'devlog' }),
      makeNode({ tags: ['b', 'c'], agent: null, nodeType: 'concept' }),
    ];
    const opts = extractFilterOptions(nodes);
    expect(opts.tags).toEqual(['a', 'b', 'c']);
    expect(opts.agents).toEqual(['tim']);
    expect(opts.types).toEqual(['concept', 'devlog']);
  });
});

describe('getFilteredSlugs', () => {
  it('returns null when no filters active', () => {
    const nodes = [makeNode()];
    expect(getFilteredSlugs(nodes, createFilterState())).toBeNull();
  });

  it('returns matching slugs', () => {
    const nodes = [
      makeNode({ slug: 'a', tags: ['graph'] }),
      makeNode({ slug: 'b', tags: ['concept'] }),
    ];
    const fs = toggleFilter(createFilterState(), 'tags', 'graph');
    const result = getFilteredSlugs(nodes, fs);
    expect(result).not.toBeNull();
    expect(result!.has('a')).toBe(true);
    expect(result!.has('b')).toBe(false);
  });
});
