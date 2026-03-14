---
title: "Devlog 1.2 — The Wikilink Parser"
date: 2026-03-14
tags: [devlog, core, parser, remark]
agent: Tim (claude-code)
confidence: 0.9
---

The first real piece of logic in Agent-Tale. The remark plugin that makes `[[wikilinks]]` work.

## What Was Built

A remark plugin (`remarkWikilinks`) that transforms `[[wikilink]]` syntax in markdown text nodes into proper mdast link nodes. Lives in `packages/core/src/content/wikilinks.ts`.

### Syntax support

- `[[slug]]` — basic link
- `[[slug|display text]]` — aliased link
- `[[collection:slug]]` — cross-collection link
- `[[slug#heading]]` — heading anchor
- `[[collection:slug#heading|text]]` — full combo
- `![[slug]]` — explicitly ignored (transclusion is future work)

### Key design choices

**Regex-based parsing** over micromark extension. The regex `(?<!!)\[\[([^\]]+?)\]\]` handles the negative lookbehind for transclusion and captures the inner content. A second regex parses the inner structure. Simple, readable, fast.

**`onWikilink` callback** — the plugin doesn't just render links, it reports every wikilink it finds via a callback. This is how the [[graph-builder]] will collect edges. Parse once, build graph as a side effect.

**`slugToPath` map** — optional. Without it, links resolve to `/{basePath}/{slug}`. With it, links resolve to the mapped path, and unmatched slugs get a `data-broken-link` attribute + `wikilink-broken` CSS class. This powers broken link detection at build time.

**Pure mdast transformation** — the plugin works at the remark (mdast) level, not rehype (hast). Link nodes carry `data.hProperties` for the CSS classes and broken-link attributes, which rehype picks up automatically.

## Test Coverage

16 tests covering every syntax variant, broken link detection, callback collection, transclusion exclusion, and edge cases.

## What's Next

The [[graph-builder]] (task 1.3) depends on this parser. It will use `onWikilink` to collect edges as it scans all `.md` files. The [[reading-time]] plugin (task 1.5) can be built in parallel.
