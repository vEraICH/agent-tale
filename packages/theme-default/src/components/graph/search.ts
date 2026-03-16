/**
 * Search — substring match on title/slug/tags.
 *
 * Returns a set of matching slugs. Used by renderer to
 * highlight matches and ghost non-matches.
 */

import type { SimNode, SearchState } from './types';

export function createSearchState(): SearchState {
  return { query: '', matches: new Set() };
}

/** Run a search and return a new SearchState. */
export function runSearch(nodes: SimNode[], query: string): SearchState {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return { query, matches: new Set() };
  }

  const matches = new Set<string>();
  for (const node of nodes) {
    if (
      node.title.toLowerCase().includes(trimmed) ||
      node.slug.toLowerCase().includes(trimmed) ||
      node.tags.some((t) => t.toLowerCase().includes(trimmed))
    ) {
      matches.add(node.slug);
    }
  }

  return { query, matches };
}

/** Check if search is active (has a non-empty query). */
export function isSearchActive(state: SearchState): boolean {
  return state.query.trim().length > 0;
}

/** Get the first matched node (for "enter to center" behavior). */
export function getFirstMatch(
  state: SearchState,
  nodes: SimNode[],
): SimNode | null {
  if (!isSearchActive(state)) return null;
  for (const node of nodes) {
    if (state.matches.has(node.slug)) return node;
  }
  return null;
}
