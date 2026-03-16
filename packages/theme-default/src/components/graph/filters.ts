/**
 * Filters — extract available options from graph data, apply toggle logic.
 *
 * AND logic across categories (tag AND type AND agent).
 * Empty set in a category = all pass for that category.
 */

import type { SimNode, FilterState } from './types';

/** Extract all unique tags, agents, and node types from the data. */
export function extractFilterOptions(nodes: SimNode[]): {
  tags: string[];
  agents: string[];
  types: string[];
} {
  const tagSet = new Set<string>();
  const agentSet = new Set<string>();
  const typeSet = new Set<string>();

  for (const node of nodes) {
    for (const tag of node.tags) tagSet.add(tag);
    if (node.agent) agentSet.add(node.agent);
    typeSet.add(node.nodeType);
  }

  return {
    tags: [...tagSet].sort(),
    agents: [...agentSet].sort(),
    types: [...typeSet].sort(),
  };
}

export function createFilterState(): FilterState {
  return {
    tags: new Set(),
    agents: new Set(),
    types: new Set(),
  };
}

/** Toggle a value in a filter category. */
export function toggleFilter(
  state: FilterState,
  category: keyof FilterState,
  value: string,
): FilterState {
  const next = new Set(state[category]);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return { ...state, [category]: next };
}

/** Clear all filters in a category. */
export function clearFilterCategory(
  state: FilterState,
  category: keyof FilterState,
): FilterState {
  return { ...state, [category]: new Set<string>() };
}

/** Clear all filters. */
export function clearAllFilters(): FilterState {
  return createFilterState();
}

/** Check if any filters are active. */
export function hasActiveFilters(state: FilterState): boolean {
  return state.tags.size > 0 || state.agents.size > 0 || state.types.size > 0;
}

/** Test whether a node passes the current filters. */
export function nodePassesFilter(node: SimNode, state: FilterState): boolean {
  // Tags: node must have at least one of the selected tags
  if (state.tags.size > 0) {
    if (!node.tags.some((t) => state.tags.has(t))) return false;
  }

  // Agents: node's agent must be in the selected set
  if (state.agents.size > 0) {
    if (!node.agent || !state.agents.has(node.agent)) return false;
  }

  // Types: node's type must be in the selected set
  if (state.types.size > 0) {
    if (!state.types.has(node.nodeType)) return false;
  }

  return true;
}

/** Get the set of slugs that pass the filter. Returns null if no filters active. */
export function getFilteredSlugs(
  nodes: SimNode[],
  state: FilterState,
): Set<string> | null {
  if (!hasActiveFilters(state)) return null;
  const result = new Set<string>();
  for (const node of nodes) {
    if (nodePassesFilter(node, state)) result.add(node.slug);
  }
  return result;
}
