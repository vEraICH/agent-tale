# TASKS.md — Agent-Tale Task Board

> This is the primary coordination file. Update status as you work.
> Read relevant `docs/*.md` ONLY when picking up a task — don't preload everything.
> Completed tasks archived in `docs/task/archive-20260407.md`.

## Status Legend

| Status | Meaning |
|---|---|
| `pending` | Not started, ready to pick up |
| `blocked` | Waiting on another task (see `depends` column) |
| `in-progress` | Currently being worked on |
| `review` | Code written, needs testing/validation |
| `completed` | Done and verified |

---


## VRA-Lab Building — Make It Outstanding

Make VRA Lab the blog that makes people notice Agent-Tale. Gap analysis: `docs/research/gap-analysis.md`

### Sprint 1 — Reading Experience (quick wins)

| # | Task | Status | Depends | Context Doc | Notes |
|---|---|---|---|---|---|
| vra-1 | Copy code button on all `<pre>` blocks | `completed` | — | `docs/research/gap-analysis.md` | One-click copy, visual feedback. Table-stakes for dev blogs. |
| vra-2 | Next/previous post navigation | `completed` | — | `docs/research/gap-analysis.md` | Date-ordered prev/next links at bottom of every post. Biggest engagement lever. |
| vra-3 | Shiki dual theme (light + dark code blocks) | `completed` | — | `docs/research/gap-analysis.md` | Use Astro's `markdown.shikiConfig.themes` for theme-aware syntax highlighting. |
| vra-4 | Reading progress indicator | `completed` | — | `docs/research/gap-analysis.md` | Thin accent bar at viewport top, tracks scroll through post content. |
| vra-5 | Table of contents for long posts | `completed` | — | `docs/research/gap-analysis.md` | Auto-generated from headings. Show on posts with 3+ headings. Sticky sidebar or collapsible top. |

### Sprint 2 — SEO & Discoverability

| # | Task | Status | Depends | Context Doc | Notes |
|---|---|---|---|---|---|
| vra-6 | JSON-LD structured data (BlogPosting) | `completed` | — | `docs/research/gap-analysis.md` | Schema.org BlogPosting on every post page. Title, date, author, description. |
| vra-7 | Dynamic OG image generation | `completed` | — | `docs/research/gap-analysis.md` | Satori/resvg at build time. Branded image with post title + date. Every post gets one. |

### Sprint 2.5 — LLM-Friendly Content (differentiator, low effort)

| # | Task | Status | Depends | Context Doc | Notes |
|---|---|---|---|---|---|
| vra-15 | `/llms.txt` — auto-generated site index | `completed` | — | `docs/research/gap-analysis.md` | Markdown index of all posts with titles, descriptions, tags, connection counts. Auto-generated at build time. |
| vra-16 | `/posts/{slug}.md` — raw markdown endpoint | `completed` | — | `docs/research/gap-analysis.md` | Serve raw markdown for any post. We're file-first — just expose what we already have. |
| vra-17 | "LLM" button on post pages | `completed` | vra-16 | `docs/research/gap-analysis.md` | Small button linking to the `.md` version. DatoCMS-style but minimal. |

### Sprint 3 — Digital Garden Identity (differentiator)

| # | Task | Status | Depends | Context Doc | Notes |
|---|---|---|---|---|---|
| vra-9 | Wikilink hover previews | `pending` | — | `docs/research/gap-analysis.md` | Popover on hover: title + first ~100 words. THE digital garden feature. |
| vra-9 | Wikilink hover previews | `completed` | — | `docs/research/gap-analysis.md` | Popover on hover: title + first ~80 words. Pin on click. /api/preview/[slug] endpoint. |
| vra-10 | Connection indicators on post cards | `in-progress` | — | `docs/research/gap-analysis.md` | Show connection count on PostCard for posts with 2+ links. |
| vra-11 | Post neighborhood mini-graph | `pending` | vra-9 | `docs/research/gap-analysis.md` | Small force-directed graph on each post showing local neighborhood (depth 1-2). |
| vra-12 | Related posts by graph proximity | `pending` | vra-10 | `docs/research/gap-analysis.md` | "Connected tales" section: 3-5 closest posts by graph distance, not just tags. |

---

## VRA-Lab — Sprint 4: Engagement & Content

| # | Task | Status | Depends | Context Doc | Notes |
|---|---|---|---|---|---|
| vra-13 | Newsletter signup (Buttondown or Resend) | `pending` | — | `docs/research/gap-analysis.md` | Simple email form in footer or post footer. |
| vra-14 | Post series / collections | `pending` | — | `docs/research/gap-analysis.md` | Frontmatter `series` + `seriesOrder`. Series nav at top of post. |

---

## Memory System — Agent-Tale as LLM Memory Backend

Research: `docs/research/llm-memory.md`

Dogfood consolidation (Option B) completed 2026-04-07: 4 knowledge summary posts written from 12 devlogs.
Friction list captured in `devlog-2026-04-07.md`. MCP server (2.5 + 2.6) completed same session — mem-1 and mem-3 blockers now cleared.

| # | Task | Status | Depends | Context Doc | Notes |
|---|---|---|---|---|---|
| mem-0 | VRA Lab blog post: "We built this before Karpathy named it" | `completed` | — | `docs/research/llm-memory.md` | Option C. Public-facing post on vra-lab about Agent-Tale as Markdown-First Architecture, validated by Karpathy April 2026. |
| mem-1 | Memory-scoped MCP tools | `pending` | ~~2.5~~ ✓ | `docs/research/llm-memory.md` | Thin adapter layer over MCP tools using OpenMemory API naming: `store_memory`, `retrieve_memory`, `get_memory_context`. `memory` as a first-class collection type. Any MCP-compatible agent treats Agent-Tale as drop-in memory backend with zero architecture change. **2.5 completed 2026-04-07 — blocker cleared.** |
| mem-2 | Bi-temporal frontmatter schema | `completed` | — | `docs/research/llm-memory.md` | Add `valid_until`, `superseded_by`, `confidence`, `sources` to frontmatter schema + SQLite graph index. Every post becomes a temporally bounded fact. Agents can query "what did we believe about X in Q4 2025?" History preserved, not overwritten. |
| mem-2a | `type: knowledge` visual treatment | `completed` | — | — | KnowledgeLayout with badge, left border, provenance panel. Badge in PostCard list. Core frontmatter schema updated. |
| mem-3 | Agent-authored consolidation MCP tool | `pending` | ~~2.5~~ ✓ | `docs/research/llm-memory.md` | `consolidate_memories({ topic, source_slugs })` — agent reads N episodic posts, authors a semantic summary post, wikilinks back to sources, stamps `consolidated_into` on originals. Episodic → semantic layer in the graph. Auditable markdown consolidation; no other memory system does this. **2.5 completed 2026-04-07 — blocker cleared.** |

---

## Phase 2 — Differentiation

| # | Task | Status | Depends | Context Doc | Notes |
|---|---|---|---|---|---|
| 2.3 | Admin UI — file browser | `pending` | 2.1 | `docs/monorepo-structure.md` | Tree view of content directory. Create/rename/delete |
| 2.4 | Admin UI — graph explorer | `pending` | 2.1, 1.10 | `docs/monorepo-structure.md` | Interactive graph with orphan highlighting, click-to-navigate |
| 2.5 | MCP server — core tools | `completed` | 1.3 | `docs/mcp-server.md` | `write_post`, `read_post`, `search`, `get_backlinks`, `get_recent` |
| 2.6 | MCP server — graph tools | `completed` | 2.5 | `docs/mcp-server.md` | `get_graph_neighborhood`, `suggest_links`, `get_orphans` |
| 2.7 | MCP server — file watcher | `pending` | 2.5 | `docs/mcp-server.md` | Watch content dir, rebuild graph on change, live sync |
| 2.8 | Dogfood: Claude Code writes via MCP | `pending` | 2.5, 2.7 | `docs/dogfooding.md` | Integration test: Claude Code uses MCP to write posts about its own work |
| 2.9 | Unlinked mentions detection | `pending` | 1.3 | `docs/content-model.md` | Scan content for title/slug matches without explicit links |
| 2.10 | `agent-tale check` CLI command | `pending` | 1.3 | `docs/conventions.md` | Validate content: broken wikilinks, missing frontmatter, orphan detection |
| 2.11 | Integration test suite | `pending` | 2.5 | `docs/testing.md` | End-to-end: write via MCP → verify graph → verify rendered HTML |

---

## To-Be-Decided-Later

| # | Task | Status | Depends | Notes |
|---|---|---|---|---|
| vra-18 | Fix `vra-lab.tech` root domain HTTPS | `pending` | — | GoDaddy forwarding doesn't support SSL. Migrate to Cloudflare (recommended) or add root domain to Railway with redirect. |

---

## Phase 3 — Growth (Roadmap)

| # | Task | Status | Depends | Context Doc | Notes |
|---|---|---|---|---|---|
| 3.1 | OG image auto-generation | `pending` | 1.9 | `docs/roadmap.md` | Generate social preview images from title + description |
| 3.2 | Multi-collection support | `pending` | 1.3 | `docs/roadmap.md` | posts, notes, TILs, docs — each with own schema + routes |
| 3.3 | Obsidian vault import | `pending` | 1.2 | `docs/roadmap.md` | CLI command: point at vault, migrate to Agent-Tale content dir |
| 3.4 | Ghost import | `pending` | 1.3 | `docs/roadmap.md` | CLI command: import Ghost JSON export → `.md` files |
| 3.5 | Newsletter integration | `pending` | 1.9 | `docs/roadmap.md` | Buttondown / Resend integration for new post notifications |
| 3.6 | Popover link previews | `pending` | 1.8 | `docs/roadmap.md` | Hover over wikilink → show preview card with title + excerpt |
| 3.7 | Semantic search (embeddings) | `pending` | 2.5 | `docs/roadmap.md` | Optional local embeddings for MCP `search` tool |
| 3.8 | Multi-agent tracking | `pending` | 2.5 | `docs/roadmap.md` | Track which agent authored each post, agent-specific views |
| 3.9 | Content versioning / diff | `pending` | 2.1 | `docs/roadmap.md` | Git-backed version history, diff view in admin UI |
| 3.10 | Membership / paywall | `pending` | 2.1 | `docs/roadmap.md` | Optional Stripe integration for paid content |
