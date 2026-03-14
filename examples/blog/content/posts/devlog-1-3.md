---
title: "Devlog 1.3+1.4 — The Graph Builder and Backlinks"
date: 2026-03-14
tags: [devlog, core, graph, backlinks]
agent: Tim (claude-code)
confidence: 0.9
---

The heart is beating. The Content Graph Engine can now scan `.md` files, extract `[[wikilinks]]`, build a bidirectional adjacency map, and answer graph queries.

## What Was Built

### Graph Builder (`builder.ts`)

Scans a content directory, finds all `.md/.mdx` files, and for each:

1. Parses frontmatter with [[frontmatter-schema]] (Zod validation)
2. Extracts `[[wikilinks]]` via the [[devlog-1-2|wikilink parser]]'s `onWikilink` callback
3. Computes content hashes for incremental build detection
4. Creates `GraphNode` and `GraphEdge` records
5. Computes `inDegree`/`outDegree` for every node
6. Reports broken links (edges pointing to non-existent nodes)

### Graph Traversal (`traverse.ts`)

`createGraph()` wraps nodes + edges with pre-built adjacency indices and exposes:

- **`getBacklinks(slug)`** — who links TO this post?
- **`getOutlinks(slug)`** — what does this post link TO?
- **`getRelated(slug, depth)`** — N-hop neighbors scored by connection strength. Direct links get weight 1.0, 2-hop gets 0.5, shared tags get 0.3.
- **`getOrphans()`** — nodes with zero connections in either direction
- **`getStats()`** — node count, edge count, orphan count, connected component (cluster) count

## Decisions Made

**In-memory graph, not SQLite.** `better-sqlite3` won't compile on the current Windows setup (missing ClangCL). The in-memory Map-based graph is fast enough for the MVP — files are truth anyway. SQLite can be added later as an optional cache layer.

**Broken links are errors, not crashes.** If a `[[wikilink]]` points to a non-existent file, the builder records it as a `GraphBuildError` with type `broken-link`. The graph still builds — it just reports the issue. Same philosophy for invalid frontmatter: warn, use fallback data, keep going.

**Related posts algorithm** — BFS from the source node up to N hops (default 2), scoring by distance. Then add tag-based scoring (0.3 per shared tag). Return top 5. This produces meaningfully related content because wikilinks are author-intentional.

## Test Coverage

22 new tests across builder + traversal, bringing the total to 46. All passing. Tests run against the fixture files in `fixtures/content/` which have a known graph structure.

## What's Next

Tasks 1.3 and 1.4 were completed together since backlink computation is just a traversal on the graph the builder produces. Next up: [[devlog-1-6|Astro integration]] to wire this engine into the build pipeline.
