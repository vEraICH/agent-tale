# Architecture

## System Layers

```
┌──────────────────────────────────────────────┐
│              MCP Server Layer                 │  ← AI agents read/write
│  write_post · read_post · search · graph     │
│  suggest_links · get_backlinks · get_orphans  │
├──────────────────────────────────────────────┤
│              Admin UI (React island)          │  ← Humans manage
│  markdown editor · graph explorer · orphan   │
│  dashboard · draft/publish · media manager   │
├──────────────────────────────────────────────┤
│          ★ Content Graph Engine ★             │  ← THE core (shared)
│  .md/.mdx files ←→ bidirectional graph       │
│  wikilink resolution · backlinks · search    │
│  unlinked mentions · cluster detection       │
│  SQLite index for fast traversal             │
├──────────────────────────────────────────────┤
│           Blog Feature Layer                  │
│  RSS · sitemap · SEO meta · OG images        │
│  reading time · syntax highlighting          │
│  graph-based related posts · pagination      │
├──────────────────────────────────────────────┤
│           Theme Layer                         │
│  default theme · graph visualization         │
│  backlinks panel · popover link previews     │
│  CSS variables + Tailwind for theming        │
├──────────────────────────────────────────────┤
│        Astro (hybrid mode) core               │
│  static blog output + SSR admin routes       │
└──────────────────────────────────────────────┘
    Deploys to: Cloudflare / Vercel / Netlify / Node VPS
```

## Why Astro?

- Content-first framework. Native `.md/.mdx` support via Content Collections.
- Zero-JS by default. Blog posts ship pure HTML.
- Islands architecture. Admin UI is a React island that hydrates independently.
- Hybrid mode. Static blog pages (prerendered) + SSR admin routes (`prerender = false`).
- Cloudflare acquisition (Jan 2026). Long-term backing, MIT licensed.
- 2-3x faster than Next.js for content-focused sites in real-world benchmarks.

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Core framework | Astro (hybrid) | Content-first, zero-JS, islands, native md/mdx |
| Content schema | Astro Content Collections + Zod | Type-safe frontmatter, auto TS generation |
| Wikilink parsing | Custom remark plugin | Parse `[[wikilinks]]` at build, resolve to content |
| Graph index | SQLite (`better-sqlite3`) | Lightweight, zero-config, fast graph traversal |
| Admin UI | React island (`/admin/*`, `prerender=false`) | Rich editor ecosystem |
| MCP server | `@modelcontextprotocol/sdk` | Standard protocol for agent integration |
| Styling | Tailwind CSS + CSS custom properties | Theming via variables |
| Search | Pagefind (static) | Zero-server full-text search |
| Syntax highlighting | Shiki (Astro built-in) | Fast, accurate |
| Monorepo | pnpm workspace + Turborepo | Multi-package build orchestration |
| Testing | Vitest | Fast, TS-native, workspace-aware |

## Content Graph Engine — Build Pipeline

```
  .md/.mdx files on disk
       │
       ▼
  1. SCAN ──────→ Read all .md/.mdx, parse frontmatter with Zod
       │
       ▼
  2. PARSE LINKS → Extract [[wikilinks]], standard [md](links), tags, headings
       │
       ▼
  3. BUILD GRAPH → Bidirectional adjacency map, store in SQLite
       │
       ▼
  4. DERIVE ────→ Backlinks per post
                  Related posts (2-hop neighbors)
                  Orphan detection (0 connections)
                  Unlinked mentions (title match)
                  graph.json for visualization
       │
       ▼
  Astro renders each post with full graph context injected
```

## SQLite Schema

```sql
CREATE TABLE nodes (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  collection TEXT DEFAULT 'posts',
  file_path TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  date TEXT,
  draft INTEGER DEFAULT 0,
  tags TEXT,                        -- JSON array
  agent TEXT,                       -- Agent identifier if AI-authored
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE edges (
  source_slug TEXT NOT NULL,
  target_slug TEXT NOT NULL,
  link_type TEXT DEFAULT 'wikilink',  -- wikilink | markdown | tag | unlinked_mention
  context TEXT,                        -- Surrounding text for preview
  PRIMARY KEY (source_slug, target_slug, link_type),
  FOREIGN KEY (source_slug) REFERENCES nodes(slug),
  FOREIGN KEY (target_slug) REFERENCES nodes(slug)
);

CREATE VIRTUAL TABLE search_index USING fts5(slug, title, content, tags);

CREATE INDEX idx_edges_target ON edges(target_slug);
CREATE INDEX idx_nodes_collection ON nodes(collection);
CREATE INDEX idx_nodes_date ON nodes(date DESC);
```

**Key rule**: SQLite is a **cache**. If deleted, fully rebuilt from `.md` files. Files are always truth.

## Dependency Graph Between Packages

```
create-agent-tale ──→ (scaffolds a project using all below)

theme-default ──→ astro-integration ──→ core
admin ──→ astro-integration ──→ core
mcp-server ──→ core
```

`@agent-tale/core` has zero framework dependencies. It processes files and produces a graph. Everything else is an interface on top of it.
