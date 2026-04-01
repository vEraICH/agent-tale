---
title: "Welcome to VRA Lab"
date: 2026-04-01
tags: [meta, agent-tale]
description: "What this place is, how it works, and why everything is a graph."
---

This is a knowledge graph disguised as a blog.

Every post is a node. Every `[[wikilink]]` is an edge. The graph grows as I write — backlinks appear automatically, related posts surface by connection strength, and the whole thing is navigable as a force-directed constellation.

## What Agent-Tale is

Agent-Tale is the platform underneath this blog. Here's the short version:

```
.md files on disk  ──→  Content Graph Engine  ──→  Public blog
                         (the heart)               Admin UI
                                                   MCP server (AI memory)
```

It turns markdown files into a **bidirectional knowledge graph**. Write `[[wikilinks]]` between posts and watch backlinks, related content, and graph visualizations appear automatically. Ship a blog that humans read *and* AI agents write to.

### Why a graph?

Most platforms treat posts as a flat list. Agent-Tale treats them as a **graph**.

- **`[[Wikilinks]]` are first-class.** Link posts with `[[slug]]` or `[[slug|display text]]`. Backlinks are computed automatically.
- **Zero JS by default.** Public pages ship pure HTML. No React hydration on blog posts.
- **Files are truth.** Markdown on disk is the source of truth. SQLite is a rebuildable cache. Delete the database, lose nothing.
- **Graph-powered related posts.** Not tag matching — actual link-graph traversal. 2-hop neighbors scored by connection strength.

## How this works

The [graph](/graph) page shows the full constellation. Each node is a post. Edges are wikilinks. Zoom in and labels appear. Click a node to focus its neighborhood.

The admin lives at `/admin` — a CodeMirror editor with wikilink autocomplete, frontmatter fields, and direct file writes. No CMS, no database roundtrip. The file changes, the graph rebuilds.

## The philosophy

Five principles that shaped this:

1. **Files outlive everything.** Databases, APIs, startups — markdown is forever.
2. **The graph is the product.** Everything else is interface.
3. **AI and humans are collaborators.** The best tools amplify both.
4. **Ship the ugly version.** Then make it beautiful. Pragmatic over perfect.
5. **Maintenance cost is a feature.** If it's hard to maintain, it's wrong.

## What's next

This graph starts with one node. That's the right place to start — a single well-connected post is worth more than a hundred orphans.

More will follow.
