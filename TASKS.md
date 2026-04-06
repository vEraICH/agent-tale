# TASKS.md — Agent-Tale Task Board

> This is the primary coordination file. Update status as you work.
> Read relevant `docs/*.md` ONLY when picking up a task — don't preload everything.

## Status Legend

| Status | Meaning |
|---|---|
| `pending` | Not started, ready to pick up |
| `blocked` | Waiting on another task (see `depends` column) |
| `in-progress` | Currently being worked on |
| `review` | Code written, needs testing/validation |
| `completed` | Done and verified |

---

## Set-up-VRA-Lab — High Priority

Personal blog setup for `www.vra-lab.tech`. These tasks run in parallel with Phase 2 work.

| # | Task | Status | Depends | Notes |
|---|---|---|---|---|
| V.1 | `@agent-tale/theme-vra-lab` — custom theme (claude.ai palette) | `completed` | — | OKLCH tokens, sans-serif typography, light/dark parity |
| V.2 | Wire vra-lab blog to use `theme-vra-lab` | `completed` | V.1 | Theme wired, responsive nav (hamburger at 640px), hero hover animations, consistent 60rem containers |
| V.2.a | Home: personal hero section | `completed` | V.2 | Animated constellation SVG, hover-to-spin with bounce-back |
| V.2.b | Home: "Currently Building" section | `completed` | V.2 | 3-col grid (1-col on mobile), Agent-Tale + Veil + Threadline |
| V.2.c | Home: cap posts at 10 + "View all" | `completed` | V.2 | Sliced to 10, "View all tales →" link when >10 posts |
| V.2.d | Footer: GitHub + X social links | `completed` | V.2 | Inline SVG icons, hover to accent color |
| V.3 | Personalize VRA Lab content | `completed` | V.2 | Book-style About page (both authors), AuthorBio component, Tim's constellation avatar, footer X link updated |
| V.4 | First deploy to `www.vra-lab.tech` | `completed` | V.2, 2.13 | Railway + GoDaddy DNS. Root domain forwards to www. Live and verified. |

---

## VRA-Lab Building — Make It Outstanding

Make VRA Lab the blog that makes people notice Agent-Tale. Gap analysis: `docs/research/gap-analysis.md`

### Sprint 1 — Reading Experience (quick wins)

| # | Task | Status | Depends | Context Doc | Notes |
|---|---|---|---|---|---|
| vra-1 | Copy code button on all `<pre>` blocks | `pending` | — | `docs/research/gap-analysis.md` | One-click copy, visual feedback. Table-stakes for dev blogs. |
| vra-2 | Next/previous post navigation | `pending` | — | `docs/research/gap-analysis.md` | Date-ordered prev/next links at bottom of every post. Biggest engagement lever. |
| vra-3 | Shiki dual theme (light + dark code blocks) | `pending` | — | `docs/research/gap-analysis.md` | Use Astro's `markdown.shikiConfig.themes` for theme-aware syntax highlighting. |
| vra-4 | Reading progress indicator | `pending` | — | `docs/research/gap-analysis.md` | Thin accent bar at viewport top, tracks scroll through post content. |
| vra-5 | Table of contents for long posts | `pending` | — | `docs/research/gap-analysis.md` | Auto-generated from headings. Show on posts with 3+ headings. Sticky sidebar or collapsible top. |

### Sprint 2 — SEO & Discoverability

| # | Task | Status | Depends | Context Doc | Notes |
|---|---|---|---|---|---|
| vra-6 | JSON-LD structured data (BlogPosting) | `pending` | — | `docs/research/gap-analysis.md` | Schema.org BlogPosting on every post page. Title, date, author, description. |
| vra-7 | Dynamic OG image generation | `pending` | — | `docs/research/gap-analysis.md` | Satori/resvg at build time. Branded image with post title + date. Every post gets one. |
| vra-8 | Search (site-wide) | `pending` | — | `docs/research/gap-analysis.md` | Pagefind or similar. Search by title, tags, content. Accessible from nav. |

### Sprint 3 — Digital Garden Identity (differentiator)

| # | Task | Status | Depends | Context Doc | Notes |
|---|---|---|---|---|---|
| vra-9 | Wikilink hover previews | `pending` | — | `docs/research/gap-analysis.md` | Popover on hover: title + first ~100 words. THE digital garden feature. |
| vra-10 | Connection indicators on post cards | `pending` | — | `docs/research/gap-analysis.md` | Show connection count on PostCard for posts with 2+ links. |
| vra-11 | Post neighborhood mini-graph | `pending` | vra-9 | `docs/research/gap-analysis.md` | Small force-directed graph on each post showing local neighborhood (depth 1-2). |
| vra-12 | Related posts by graph proximity | `pending` | vra-10 | `docs/research/gap-analysis.md` | "Connected tales" section: 3-5 closest posts by graph distance, not just tags. |

### Sprint 4 — Engagement & Content

| # | Task | Status | Depends | Context Doc | Notes |
|---|---|---|---|---|---|
| vra-13 | Newsletter signup (Buttondown or Resend) | `pending` | — | `docs/research/gap-analysis.md` | Simple email form in footer or post footer. |
| vra-14 | Post series / collections | `pending` | — | `docs/research/gap-analysis.md` | Frontmatter `series` + `seriesOrder`. Series nav at top of post. |

---

## Phase 1 — Core Loop (MVP Weekend)

These tasks produce: `npx create-agent-tale` → working blog with wikilinks + backlinks + graph.

| # | Task | Status | Depends | Context Doc | Notes |
|---|---|---|---|---|---|
| 1.1 | Initialize monorepo (pnpm workspace + turbo) | `completed` | — | `docs/monorepo-structure.md` | Create workspace root, all package.json stubs, tsconfig base |
| 1.2 | Implement remark-wikilink plugin | `completed` | — | `docs/content-model.md` | Parse `[[slug]]`, `[[slug\|text]]`, `[[collection:slug]]`. Output hast anchor nodes. |
| 1.3 | Implement graph builder | `completed` | 1.2 | `docs/architecture.md` | Scan `.md` files → extract wikilinks + md links → build adjacency map → write SQLite |
| 1.4 | Implement backlink computation | `completed` | 1.3 | `docs/architecture.md` | Query graph for incoming edges per node. Expose as `getBacklinks(slug)` |
| 1.5 | Implement reading-time remark plugin | `completed` | — | `docs/content-model.md` | Inject `minutesRead` into frontmatter via remark |
| 1.6 | Create Astro integration package | `completed` | 1.3, 1.4 | `docs/architecture.md` | Wire graph engine into Astro build pipeline. Provide virtual module `agent-tale:graph` |
| 1.7 | Create default theme — layouts | `completed` | 1.6 | `docs/monorepo-structure.md` | `BaseLayout.astro`, `PostLayout.astro` with backlinks panel, `index.astro` |
| 1.8 | Create default theme — components | `completed` | 1.7 | `docs/monorepo-structure.md` | `BacklinksPanel`, `PostCard`, `PostList`, `TagList`, `ThemeToggle`. LinkPreview deferred to 3.6. |
| 1.9 | Create default theme — pages | `completed` | 1.7, 1.8 | `docs/monorepo-structure.md` | `posts/[...slug].astro`, `tags/[tag].astro`, `tags/index.astro`, `rss.xml.ts`, `sitemap.xml.ts` |
| 1.14 | Lessons Learned post type | `completed` | 1.9 | `docs/content-model.md` | New content type for agent/human lessons. Frontmatter: `type: lesson`, `mistake`, `insight`, `applies_to`. LessonLayout with callout, badge. First lesson: CSS scoping bug. |
| 1.10 | Graph visualization page | `completed` | 1.3, 1.8 | `docs/architecture.md` | Static graph page. React island with force-directed layout. `client:visible` |
| 1.11 | Create `create-agent-tale` CLI | `completed` | 1.7, 1.9 | `docs/monorepo-structure.md` | `npx create-agent-tale my-blog` — scaffold project, copy template, install deps |
| 1.12 | Write seed content (dogfood) | `completed` | 1.9 | `docs/dogfooding.md` | Write 5-10 interconnected `.md` posts about building Agent-Tale itself |
| 1.13 | Core test suite | `completed` | 1.2, 1.3, 1.4 | `docs/testing.md` | Unit tests for wikilink parser, graph builder, backlink computation |

## Phase 2 — Differentiation

| # | Task | Status | Depends | Context Doc | Notes |
|---|---|---|---|---|---|
| 2.1 | Admin UI — API routes | `completed` | 1.6 | `docs/architecture.md` | Astro API routes at `/api/posts`, `/api/graph`, `/api/media`. CRUD for `.md` files |
| 2.2 | Admin UI — markdown editor | `completed` | 2.1 | `docs/monorepo-structure.md` | React island. CodeMirror with markdown + wikilink autocomplete |
| 2.3 | Admin UI — file browser | `pending` | 2.1 | `docs/monorepo-structure.md` | Tree view of content directory. Create/rename/delete |
| 2.4 | Admin UI — graph explorer | `pending` | 2.1, 1.10 | `docs/monorepo-structure.md` | Interactive graph with orphan highlighting, click-to-navigate |
| 2.5 | MCP server — core tools | `pending` | 1.3 | `docs/mcp-server.md` | `write_post`, `read_post`, `search`, `get_backlinks`, `get_recent` |
| 2.6 | MCP server — graph tools | `pending` | 2.5 | `docs/mcp-server.md` | `get_graph_neighborhood`, `suggest_links`, `get_orphans` |
| 2.7 | MCP server — file watcher | `pending` | 2.5 | `docs/mcp-server.md` | Watch content dir, rebuild graph on change, live sync |
| 2.8 | Dogfood: Claude Code writes via MCP | `pending` | 2.5, 2.7 | `docs/dogfooding.md` | Integration test: Claude Code uses MCP to write posts about its own work |
| 2.9 | Unlinked mentions detection | `pending` | 1.3 | `docs/content-model.md` | Scan content for title/slug matches without explicit links |
| 2.10 | `agent-tale check` CLI command | `pending` | 1.3 | `docs/conventions.md` | Validate content: broken wikilinks, missing frontmatter, orphan detection |
| 2.11 | Integration test suite | `pending` | 2.5 | `docs/testing.md` | End-to-end: write via MCP → verify graph → verify rendered HTML |
| 2.12 | Obsidian-grade graph view | `completed` | 1.10 | `docs/architecture.md` | Elevate graph to Obsidian Graph View level. Starfield feel at scale — thousands of nodes as constellations. Zoom, pan, local graph (neighborhood view), filters (by tag/agent/type), search-to-highlight, fade distant nodes. The graph IS the differentiation — digital garden users will compare this to Obsidian. Make them feel at home, then go further. Essential features only; Agent-Tale flavor, not a copy. |
| 2.13 | Railway deployment | `completed` | 2.1 | `docs/architecture.md` | Add `@astrojs/node` adapter (hybrid mode), `railway.toml` with pnpm build/start, SQLite persistent volume path, `PUBLIC_SITE_URL` env var support |

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
