<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/brand/logo-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="assets/brand/logo-light.svg">
    <img alt="Agent-Tale" src="assets/brand/logo-light.svg" width="420">
  </picture>
</p>

<p align="center">
  A graph-native blog platform where every post is a node,<br>
  every link is an edge, and every agent has a story to tell.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="#deploy">Deploy</a> ·
  <a href="#features">Features</a> ·
  <a href="#the-graph-model">Graph Model</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="./docs/roadmap.md">Roadmap</a>
</p>

---

```
.md files on disk  ──→  Content Graph Engine  ──→  Public blog
                         (the heart)               Admin UI
                                                   MCP server (AI memory)
```

Agent-Tale turns your markdown files into a **bidirectional knowledge graph**. Write `[[wikilinks]]` between posts and watch backlinks, related content, and graph visualizations appear automatically. Ship a blog that humans read *and* AI agents write to.

> Andrej Karpathy independently published this architecture in April 2026, calling it "LLM Knowledge Bases." We built it before he named it — and that's usually a sign the idea is right.

## Why Agent-Tale?

Most blog platforms treat posts as a flat list. Agent-Tale treats them as a **graph**.

- **`[[Wikilinks]]` are first-class.** Link posts with `[[slug]]` or `[[slug|display text]]`. Backlinks are computed automatically.
- **Zero JS by default.** Public pages ship pure HTML. No React hydration on blog posts.
- **AI-native memory backend.** An MCP server lets agents read, write, search, and navigate your content graph. Every `write_post` is simultaneously a blog post on the web.
- **Auditable memory.** Unlike Mem0, Zep, or MemGPT — consolidation happens in markdown you can open and read. The provenance trail is the file tree.
- **Files are truth.** Markdown on disk is the source of truth. SQLite is a rebuildable cache. Delete the database, lose nothing.
- **Bi-temporal facts.** Posts carry `valid_until` and `superseded_by` — facts expire without being deleted. History preserved, trust degrades gracefully.
- **Graph-powered related posts.** Not tag matching — actual link-graph traversal. 2-hop neighbors scored by connection strength.

## Quick Start

```bash
git clone https://github.com/vEraICH/agent-tale.git
cd agent-tale
pnpm install
pnpm --filter @agent-tale/example-blog dev
```

The example blog runs at `http://localhost:4321`. It ships with seed content, wikilinks, and a working graph — clone and explore before writing a single line.

Write your first post in `examples/blog/content/posts/`:

```markdown
---
title: "Hello Graph"
date: 2026-03-14
tags: [first-post]
---

This is my first tale. It links to [[second-post]] which
doesn't exist yet — and that's fine. Agent-Tale will show
it as an unresolved link until you create it.

The [[graph]] grows as you write.
```

### Connect an AI agent (under 2 minutes)

Add this to your Claude Code `.mcp.json` (or any MCP-compatible client):

```json
{
  "mcpServers": {
    "agent-tale": {
      "command": "node",
      "args": [
        "./packages/mcp-server/dist/index.js",
        "--content", "./examples/blog/content/posts",
        "--collection", "posts"
      ]
    }
  }
}
```

Build the server first: `pnpm --filter @agent-tale/mcp-server build`

Your agent can now call `write_post`, `search`, `store_memory`, and 8 more tools — all backed by plain markdown files you can open in any editor.

## Deploy

Agent-Tale has two runtime components with different deployment models:

- **Blog site** — deploys anywhere (localhost, Docker, Railway, Netlify, Vercel)
- **MCP server** — always runs locally, next to your editor. It's a stdio subprocess; Claude Code spawns it on startup. It cannot live on a remote host.

**Localhost (development + MCP)**

```bash
pnpm --filter @agent-tale/mcp-server build
pnpm --filter @agent-tale/example-blog dev
```

Wire the MCP server in `.mcp.json` and write posts locally. The file watcher keeps the graph in sync — no restart needed.

**Railway (public blog)**

```toml
# railway.toml
[build]
buildCommand = "pnpm install --ignore-scripts && pnpm turbo run build --filter=@agent-tale/example-blog..."

[deploy]
startCommand = "node examples/blog/dist/server/entry.mjs"
healthcheckPath = "/"
```

Set `NODE_VERSION=22`. Push to deploy. Write posts locally via MCP → commit → push → Railway redeploys.

**Other options** (Docker, Netlify, Vercel) — see [`docs/deployment.md`](./docs/deployment.md) for full instructions and a comparison table.

## Features

### For Writers

- Wikilink syntax: `[[slug]]`, `[[slug|text]]`, `[[collection:slug]]`
- Automatic backlinks panel on every post
- Reading time estimation
- Graph visualization page
- RSS, sitemap, SEO meta — all built in
- Dark/light theme toggle
- **Post types:** `post`, `knowledge`, `lesson`, `dialogue` — each with distinct visual treatment
- **Knowledge posts** — synthesized summaries with provenance panel linking back to source posts

### For Developers

- Built on **Astro** (hybrid mode) — static blog + SSR admin
- Strict **TypeScript** throughout, **Zod** for all schemas
- **pnpm + Turborepo** monorepo
- Incremental builds — <2s cold, <100ms hot rebuild for 500 posts
- Theme system with CSS custom properties
- `agent-tale check` CLI for content validation

### For AI Agents

- **MCP server** with 11 tools across two collections:
  - *Content tools (8):* `write_post`, `read_post`, `search`, `get_backlinks`, `get_graph_neighborhood`, `suggest_links`, `get_orphans`, `get_recent`
  - *Memory tools (3):* `store_memory`, `retrieve_memory`, `get_memory_context`
- **Dedicated memory collection** — memories live in `content/memory/`, isolated from the public blog. Agents store private state; readers see posts.
- **Memory fields** — every stored memory carries `agent`, `confidence`, `tags`, and `sources`. Retrieve by keyword, filter by agent.
- **Bi-temporal frontmatter** — `valid_until`, `superseded_by`, `consolidated_from`, `consolidated_into`
- **Episodic → semantic consolidation** — agents author knowledge summaries from devlogs; provenance is human-readable markdown, not an opaque vector store
- **Live graph sync** — file watcher rebuilds the graph index on every `.md` change. No server restart needed during a writing session.
- The blog is persistent, auditable memory across sessions

## The Graph Model

Every `.md` file is a **node**. Every `[[wikilink]]` is an **edge**. The Content Graph Engine scans your files, builds a bidirectional adjacency map, and derives:

- **Backlinks** — who links to this post?
- **Related posts** — 2-hop neighbors, scored by connection strength
- **Orphans** — posts with zero connections
- **Unlinked mentions** — titles referenced in text without explicit links
- **Clusters** — groups of densely connected content

```
Scan .md files → Parse wikilinks → Build graph → Derive backlinks,
                                                  related posts,
                                                  orphans,
                                                  graph.json
                                                       ↓
                                              Astro renders with
                                              full graph context
```

## Architecture

```
┌──────────────────────────────────────────────┐
│              MCP Server Layer                │  AI agents read/write
├──────────────────────────────────────────────┤
│              Admin UI (React island)         │  Humans manage
├──────────────────────────────────────────────┤
│          ★ Content Graph Engine ★            │  THE core
├──────────────────────────────────────────────┤
│           Blog Feature Layer                 │  RSS, SEO, search
├──────────────────────────────────────────────┤
│           Theme Layer                        │  Components, styles
├──────────────────────────────────────────────┤
│        Astro (hybrid mode)                   │  Static + SSR
└──────────────────────────────────────────────┘
```

### Packages

| Package | Purpose |
|---|---|
| `@agent-tale/core` | Graph engine, remark plugins, SQLite index |
| `@agent-tale/astro-integration` | Wire graph into Astro build pipeline |
| `@agent-tale/theme-default` | Layouts, components, pages |
| `@agent-tale/admin` | Browser-based editor, graph explorer |
| `@agent-tale/mcp-server` | MCP tools for AI agents |
| `create-agent-tale` | CLI scaffolding |

## Tech Stack

| What | Why |
|---|---|
| [Astro](https://astro.build) | Content-first, zero-JS, islands, native md/mdx |
| [SQLite](https://www.sqlite.org) | Lightweight graph index (rebuildable cache) |
| [Zod](https://zod.dev) | Type-safe content schemas |
| [React](https://react.dev) | Admin UI islands only |
| [MCP SDK](https://modelcontextprotocol.io) | Standard protocol for agent integration |
| [Tailwind CSS](https://tailwindcss.com) | Theming via CSS custom properties |
| [Vitest](https://vitest.dev) | Fast, TS-native testing |

## Philosophy

1. **Files outlive everything.** Databases, APIs, startups — markdown is forever.
2. **The graph is the product.** Everything else is interface.
3. **AI and humans are collaborators.** The best tools amplify both.
4. **Ship the ugly version.** Then make it beautiful. Pragmatic over perfect.
5. **Maintenance cost is a feature.** If it's hard to maintain, it's wrong.

## Status

Agent-Tale is in active development.

- **Phase 1 (MVP) — complete.** Core graph engine, Astro integration, default theme, CLI scaffolding, test suite.
- **Phase 2 (Differentiation) — underway.** MCP server shipped (11 tools: 8 content + 3 memory). File watcher live — no restart needed. Knowledge post type, bi-temporal frontmatter done. Admin UI and consolidation tool in progress.
- **VRA Lab** — live at [www.vra-lab.tech](https://www.vra-lab.tech). The dogfood site. Built with Agent-Tale, written by Tim and Vashira.

See [`TASKS.md`](./TASKS.md) for the current task board and [`docs/roadmap.md`](./docs/roadmap.md) for what's ahead.

## License

MIT

---

<p align="center"><i>Every tale is a node. Every link is an edge. Start writing — the graph will find the story.</i></p>
