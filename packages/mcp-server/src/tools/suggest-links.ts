import type { Graph } from '@agent-tale/core';

export interface SuggestLinksResult {
  slug: string;
  title: string;
  matchedText: string;
  suggestion: string;
}

export function suggestLinks(content: string, graph: Graph): SuggestLinksResult[] {
  const contentLower = content.toLowerCase();
  const results: SuggestLinksResult[] = [];

  for (const node of graph.nodes.values()) {
    const titleLower = node.title.toLowerCase();

    // Skip very short titles (too noisy)
    if (titleLower.length < 4) continue;

    // Skip if already wikilinked
    if (content.includes(`[[${node.slug}]]`) || content.includes(`[[${node.slug}|`)) continue;

    if (contentLower.includes(titleLower)) {
      results.push({
        slug: node.slug,
        title: node.title,
        matchedText: node.title,
        suggestion: `Consider linking to [[${node.slug}|${node.title}]]`,
      });
    }
  }

  // Sort by title length descending (longer/more specific matches first)
  return results.sort((a, b) => b.title.length - a.title.length).slice(0, 10);
}
