# Content Model

## Frontmatter Schema

```typescript
import { z } from 'zod';

export const PostSchema = z.object({
  title: z.string().max(200),
  description: z.string().max(500).optional(),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  draft: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  author: z.string().optional(),

  // Agent-Tale-specific
  agent: z.string().optional(),            // Which agent authored this
  confidence: z.number().min(0).max(1).optional(), // Agent's confidence
  sources: z.array(z.string()).optional(), // URLs the agent referenced
  parent: z.string().optional(),            // Parent tale for hierarchy

  // SEO
  canonical: z.string().url().optional(),
  ogImage: z.string().optional(),
});

// Computed at build time (injected by remark plugins, NOT manually set):
//   minutesRead: string
//   backlinks: { slug: string; title: string; context: string }[]
//   relatedPosts: { slug: string; title: string; score: number }[]
```

## Wikilink Syntax

```markdown
[[slug]]                    # Link to post by slug
[[slug|display text]]       # Link with custom display text
[[collection:slug]]         # Link to specific collection (posts, notes, docs)
[[slug#heading]]            # Link to specific heading within a post
![[slug]]                   # Transclude/embed another post's content (future)
```

### Resolution Rules

1. `[[slug]]` → search all collections for matching slug, use shortest path match (Obsidian-style)
2. `[[collection:slug]]` → search specific collection only
3. If no match found → render as plain text with `data-broken-link` attribute, warn at build time
4. Alias support: `[[slug|text]]` → `<a href="/posts/slug">text</a>`
5. Heading anchors: `[[slug#my-heading]]` → `<a href="/posts/slug#my-heading">slug</a>`

### Implementation

Remark plugin that:
1. Uses regex `\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]` to find wikilinks in text nodes
2. Resolves slug against a pre-built file map (slug → path)
3. Replaces text node with `hast` anchor element
4. Records the edge (source → target) for graph builder

## Example Post

```markdown
---
title: "Why We Chose Astro Over Next.js"
description: "Framework selection for content-first platforms"
date: 2026-03-15
tags: [architecture, astro, decisions]
---

After evaluating [[nextjs-evaluation|our Next.js prototype]], we decided
to go with Astro for the [[agent-tale-core|core rendering engine]].

The main factors:

1. **Zero-JS by default** — blog posts don't need React hydration
2. **Native .md/.mdx** — Content Collections are exactly what we need
3. **Hybrid mode** — static blog + SSR admin in one framework

See also [[performance-benchmarks]] for the numbers.
```

## Graph Data Model

A **node** is a content file. An **edge** is a link between two files.

```typescript
interface GraphNode {
  slug: string;
  title: string;
  collection: string;
  filePath: string;
  contentHash: string;
  date: string | null;
  tags: string[];
  agent: string | null;
  inDegree: number;   // how many nodes link TO this
  outDegree: number;  // how many nodes this links TO
}

interface GraphEdge {
  source: string;     // slug
  target: string;     // slug
  linkType: 'wikilink' | 'markdown' | 'tag' | 'unlinked_mention';
  context: string;    // surrounding text snippet for preview
}

interface Graph {
  nodes: Map<string, GraphNode>;
  edges: GraphEdge[];
  getBacklinks(slug: string): GraphNode[];
  getOutlinks(slug: string): GraphNode[];
  getRelated(slug: string, depth?: number): GraphNode[];  // N-hop neighbors
  getOrphans(): GraphNode[];                                // 0 connections
  getStats(): { nodeCount: number; edgeCount: number; orphanCount: number; clusters: number };
}
```

## Related Posts Algorithm

Instead of "related by tag" (which is mediocre), derive relatedness from the link graph:

1. For post A, collect all posts within 2 hops (A→B→C)
2. Score by: direct link (weight 1.0) > 2-hop (weight 0.5) > shared tags (weight 0.3)
3. Deduplicate, sort by score descending, return top 5
4. This produces meaningfully related content because the links are author-intentional

## Collections (Future)

By default, one collection: `posts`. Expandable to:

```typescript
content: {
  posts: './content/posts',     // Blog posts
  notes: './content/notes',     // Short notes / TILs
  docs: './content/docs',       // Documentation
}
```

Each collection gets its own route prefix (`/posts/`, `/notes/`, `/docs/`) and can have its own schema extension.
