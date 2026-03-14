/**
 * Remark plugin: parse [[wikilinks]] in markdown text nodes.
 *
 * Supports:
 *   [[slug]]                 → link to post by slug
 *   [[slug|display text]]    → link with custom display text
 *   [[collection:slug]]      → link to specific collection
 *   [[slug#heading]]         → link to heading within a post
 *   [[collection:slug#heading|text]] → full combo
 *
 * Each parsed wikilink is recorded as an edge for the graph builder.
 */

import type { Plugin } from 'unified';
import type { Root, Text, PhrasingContent } from 'mdast';
import { visit } from 'unist-util-visit';

/** A parsed wikilink extracted from content. */
export interface WikilinkData {
  /** Raw match text, e.g. "[[posts:my-slug#intro|Click here]]" */
  raw: string;
  /** Target slug */
  slug: string;
  /** Display text (falls back to slug if not provided) */
  displayText: string;
  /** Optional collection prefix, e.g. "posts" */
  collection: string | null;
  /** Optional heading anchor, e.g. "intro" */
  heading: string | null;
}

/** Options for the remarkWikilinks plugin. */
export interface RemarkWikilinksOptions {
  /**
   * Map of slug → resolved URL path.
   * If a slug isn't in the map, the link is rendered as broken.
   */
  slugToPath?: Map<string, string>;

  /**
   * Base path prefix for unresolved slugs.
   * Defaults to "/posts/".
   */
  basePath?: string;

  /**
   * Callback invoked for each wikilink found.
   * Use this to collect edges for the graph builder.
   */
  onWikilink?: (data: WikilinkData) => void;
}

// Matches [[...]] but not ![[...]] (transclusion is future work)
const WIKILINK_RE = /(?<!!)\[\[([^\]]+?)\]\]/g;

// Parses the inner content: optional collection:, slug, optional #heading, optional |text
const INNER_RE = /^(?:([a-zA-Z][\w-]*):)?([^#|]+?)(?:#([^|]+?))?(?:\|(.+))?$/;

/** Parse the inner text of a [[wikilink]] into structured data. */
export function parseWikilink(raw: string, inner: string): WikilinkData | null {
  const match = INNER_RE.exec(inner.trim());
  if (!match) return null;

  const [, collection, slug, heading, displayText] = match;
  const trimmedSlug = slug!.trim();

  return {
    raw,
    slug: trimmedSlug,
    displayText: displayText?.trim() ?? trimmedSlug,
    collection: collection?.trim() ?? null,
    heading: heading?.trim() ?? null,
  };
}

/** Resolve a wikilink to a URL path. */
function resolveUrl(
  data: WikilinkData,
  slugToPath: Map<string, string> | undefined,
  basePath: string,
): { href: string; broken: boolean } {
  const lookupKey = data.collection
    ? `${data.collection}:${data.slug}`
    : data.slug;

  let href = slugToPath?.get(lookupKey) ?? slugToPath?.get(data.slug);
  let broken = false;

  if (href === undefined) {
    // Fallback: construct from basePath
    const prefix = data.collection ? `/${data.collection}/` : basePath;
    href = `${prefix}${data.slug}`;
    broken = slugToPath !== undefined; // Only broken if we had a map and it wasn't found
  }

  if (data.heading) {
    href += `#${data.heading}`;
  }

  return { href, broken };
}

/**
 * Remark plugin that transforms [[wikilinks]] into mdast link nodes.
 *
 * Text nodes containing [[...]] are split into segments:
 * plain text stays as text nodes, wikilinks become link nodes.
 */
export const remarkWikilinks: Plugin<[RemarkWikilinksOptions?], Root> =
  function (options = {}) {
    const { slugToPath, basePath = '/posts/', onWikilink } = options;

    return (tree: Root) => {
      visit(tree, 'text', (node: Text, index, parent) => {
        if (index === undefined || !parent) return;

        const value = node.value;
        if (!value.includes('[[')) return;

        const children: PhrasingContent[] = [];
        let lastIndex = 0;

        // Reset regex state
        WIKILINK_RE.lastIndex = 0;

        let match: RegExpExecArray | null;
        while ((match = WIKILINK_RE.exec(value)) !== null) {
          const fullMatch = match[0]!;
          const inner = match[1]!;
          const matchStart = match.index;

          // Text before the wikilink
          if (matchStart > lastIndex) {
            children.push({
              type: 'text',
              value: value.slice(lastIndex, matchStart),
            });
          }

          const data = parseWikilink(fullMatch, inner);

          if (data) {
            onWikilink?.(data);
            const { href, broken } = resolveUrl(data, slugToPath, basePath);

            children.push({
              type: 'link',
              url: href,
              data: {
                hProperties: {
                  className: broken
                    ? 'wikilink wikilink-broken'
                    : 'wikilink',
                  ...(broken ? { 'data-broken-link': true } : {}),
                },
              },
              children: [{ type: 'text', value: data.displayText }],
            });
          } else {
            // Couldn't parse — leave as plain text
            children.push({ type: 'text', value: fullMatch });
          }

          lastIndex = matchStart + fullMatch.length;
        }

        // Text after the last wikilink
        if (lastIndex < value.length) {
          children.push({ type: 'text', value: value.slice(lastIndex) });
        }

        // Only splice if we actually found wikilinks
        if (children.length > 0 && lastIndex > 0) {
          parent.children.splice(index, 1, ...children);
          return index + children.length;
        }
      });
    };
  };
