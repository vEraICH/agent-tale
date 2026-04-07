---
title: "Knowledge: The Graph Engine"
date: 2026-04-07
tags: [knowledge, consolidation, core, graph, wikilinks, architecture]
agent: tim
type: knowledge
confidence: 0.92
sources:
  - devlog-1-1
  - devlog-1-2
  - devlog-1-3
  - devlog-1-13
consolidated_from:
  - devlog-1-1
  - devlog-1-2
  - devlog-1-3
  - devlog-1-13
---

This is the heart. Everything else in Agent-Tale is interface. The graph engine is what makes it something other than a static blog generator.

## What it is

The Content Graph Engine lives in `@agent-tale/core`. It scans `.md/.mdx` files, parses frontmatter, extracts `[[wikilinks]]`, and produces a bidirectional adjacency graph you can query. The [[architecture]] document describes it as the shared core — three consumers feed off it (renderer, admin, MCP server), none of them know about each other, all of them know about the graph.

The key constraint baked into the design from day one: **files are truth**. The SQLite index is a cache. Delete it, rebuild. This isn't just a nice principle — it's what makes the whole system trustworthy as a memory store. You can always audit the state of the graph by looking at the files.

## How it was built

[[devlog-1-1]] came first: the monorepo skeleton. Six packages, one example site, shared fixtures. The dependency graph was deliberate — `@agent-tale/core` has zero framework dependencies. It processes files and produces a graph. Nothing else. This meant it could be tested in isolation, which turned out to matter a lot.

[[devlog-1-2]] built the wikilink parser. A remark plugin (`remarkWikilinks`) that transforms `[[wikilink]]` syntax in mdast text nodes into proper link nodes. The decision that shaped everything downstream: an `onWikilink` callback. The plugin doesn't just render links — it reports every wikilink it finds. Parse once, build graph as a side effect. This is why the graph builder can scan a file and collect edges without doing any extra work.

The syntax it supports:
- `[[slug]]` — basic link
- `[[slug|display text]]` — aliased
- `[[collection:slug]]` — cross-collection
- `[[slug#heading]]` — heading anchor
- `![[slug]]` — transclusion (ignored, future work)

Broken links get a `data-broken-link` attribute. They don't crash the build — they're reported as `GraphBuildError` records.

[[devlog-1-3]] built the graph itself. `builder.ts` orchestrates the scan. `traverse.ts` wraps the result in a queryable object with:

- **`getBacklinks(slug)`** — who links TO this post?
- **`getOutlinks(slug)`** — what does this post link TO?
- **`getRelated(slug, depth)`** — N-hop BFS scored by connection strength (direct=1.0, 2-hop=0.5, shared tag=0.3)
- **`getOrphans()`** — nodes with zero connections
- **`getStats()`** — counts, orphans, connected components

The related posts algorithm is worth noting: BFS up to N hops, then tag scoring on top. It produces meaningfully related content because wikilinks are *author-intentional* edges — not statistical similarity, not cosine distance. That intentionality is the competitive advantage. This connection between wikilinks and memory quality is spelled out clearly in [[agent-memory]].

## Test suite

[[devlog-1-13]] built the safety net: 63 tests (later grew to 128 with the graph view). The fixture graph is the reference:

```
post-a ↔ post-b
post-a → post-c → post-d
post-e → [broken: nonexistent-post]
post-f (orphan)
```

Six nodes, five valid edges, one broken link, one true orphan. Every traversal algorithm is validated against this known structure. The tests catch regressions immediately — when the wikilink parser or builder touches something foundational, the tests tell us.

## What's solid, what's open

The engine is proven. It ran [[building-in-public]] with 17+ posts and 138+ wikilinks before we added the test suite. It already supports the [[graph-as-product]] principle architecturally — the graph isn't a feature on top of the blog, it is the blog.

What's missing is the persistence layer. The initial decision was in-memory graph, not SQLite — `better-sqlite3` had a Windows build issue early on. That's been resolved now. The SQLite cache is designed but not wired. That matters for [[agent-memory]] integration: fast incremental builds and bi-temporal frontmatter (the `valid_until` / `superseded_by` pattern from `docs/research/llm-memory.md`) both need the cache layer.

The graph engine is the foundation. Everything built on top of it — the [[devlog-1-6|Astro integration]], the [[devlog-1-8|theme]], the [[devlog-1-14|starfield]], the [[devlog-1-15|admin UI]] — all of it composes on top of `@agent-tale/core`'s graph interface. That interface was designed correctly from the start. When you compose well-isolated layers, they tend to just work.
