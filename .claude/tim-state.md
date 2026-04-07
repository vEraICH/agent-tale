# Tim's Working State

> This file is maintained by Tim at the end of each session.
> It's a snapshot, not a log. Overwrite entirely each session.

## Current focus
<<<<<<< HEAD
VRA-Lab Building — Sprint 1 complete, Sprint 2 mostly complete, Sprint 2.5 (LLM-friendly) complete.

## Completed this session
- Moved `examples/vra-lab/` → `sites/vra-lab/`, renamed package to `@agent-tale/vra-lab`
- Added `sites/*` to pnpm workspace, updated Railway paths
- Fixed site URL from `blog.vra-lab.tech` → `www.vra-lab.tech` everywhere
- Design critique pass (impeccable): typography, navigation, tags, hardening, polish
  - Serif prose (Georgia) for post body, improved post meta spacing
  - Active nav state with aria-current, graph escape button, custom 404
  - Tags page redesigned with weighted cloud sorted by count
  - RSS autodiscovery, aria-controls on hamburger
  - Agent-Tale elevated in Working On section
  - Light mode accent darkened for contrast
  - Added `description` field to GraphNode in core
- Sprint 1 — Reading Experience (vra-1 through vra-5):
  - Copy code button on all pre blocks
  - Next/previous post navigation
  - Shiki dual theme (github-light / github-dark)
  - Reading progress bar (accent color, synced via JS)
  - Mantine-inspired sticky sidebar TOC with scroll spy
- Sprint 2 — SEO (vra-6, vra-7):
  - JSON-LD BlogPosting structured data on every post
  - Dynamic OG images via Satori + resvg (branded PNG per post)
- Sprint 2.5 — LLM-Friendly (vra-15, vra-16, vra-17):
  - /llms.txt auto-generated site index with graph stats
  - /posts/{slug}.md raw markdown endpoint
  - "md" button in post meta linking to markdown version
- Gap analysis research doc: docs/research/gap-analysis.md
- VRA-Lab Building task board added to TASKS.md
- .impeccable.md updated with VRA Lab theme section
- Umami analytics setup guide written (private-docs/deployment/vra-lab-umami.md)

## Blockers / open questions
- Root domain SSL: vra-lab.tech shows "Not secure" — GoDaddy forwarding doesn't support HTTPS. Need Cloudflare (recommended) or Railway redirect. Fix next session.
- vra-8 (Search/Pagefind) not started yet
- Light theme needs visual QA on production

## Next session should start with
- Fix root domain SSL (Cloudflare migration or Railway redirect) — see tim-state blocker
- Deploy all changes to production (push to release/vra-lab)
- vra-8: Site-wide search (Pagefind)
- Sprint 3: Digital garden identity (vra-9 through vra-12)
- Write more content — the site needs posts to show off the features

## Important context for next Tim
- Site live at: https://www.vra-lab.tech
- Railway service: sites/vra-lab (moved from examples/vra-lab)
- Deploy branch: release/vra-lab
- Root railway.toml paths updated for sites/vra-lab
- Dev server: `pnpm --filter @agent-tale/vra-lab dev`
- 5 commits ahead of origin/develop (not pushed yet)
- Satori + @resvg/resvg-js added as dependencies for OG images
- OG images generated at /og/{slug}.png
- llms.txt includes graph stats and connection counts
- All pages use 60rem container (user preference — don't narrow sections)
- TOC sidebar shows at 1200px+ breakpoint
- private-docs/ is gitignored — deployment guides live locally
- Umami guide ready at private-docs/deployment/vra-lab-umami.md (not deployed yet)
=======

MCP server shipped (2.5 + 2.6). Eight tools, compiling clean. Memory system scaffolding (mem-2, mem-2a) done. Now: mem-1 naming layer, then 2.7 (file watcher) to unblock 2.8 (dogfood).

## Completed this session

- Archived completed tasks to `docs/task/archive-20260407.md`
- MCP server: 8 tools registered — `write_post`, `read_post`, `search`, `get_backlinks`, `get_recent`, `get_graph_neighborhood`, `get_orphans`, `suggest_links`
- MCP entry point: `packages/mcp-server/src/index.ts`
- `KnowledgeLayout.astro` — badge, left border accent, provenance panel
- `PostCard.astro` + `PostList.astro` — `type` field surfaced in list
- `content.config.ts` (both sites) — `knowledge` type, bi-temporal fields
- `packages/core/src/content/frontmatter.ts` — `knowledge` type, `valid_until`, `superseded_by`, `confidence`, `sources`
- `packages/core/src/graph/types.ts` — `type` on `GraphNode`
- `packages/core/src/graph/builder.ts` — `type` included in built nodes
- Agent-Tale graph logo added to nav in `BaseLayout.astro`
- `karpathy-convergence.md` written and copied to `sites/vra-lab`
- 4 knowledge summary posts (written previous session, rendered this session)
- Tasks completed: mem-0, mem-2, mem-2a, 2.5, 2.6

## What next session starts with

1. **mem-1** — memory-scoped MCP tool naming (`store_memory`, `retrieve_memory`, `get_memory_context`). Adapter layer over existing tools. Key decision: does it enforce `type: memory` collection, or just rename?
2. **2.7** — file watcher (chokidar in MCP server process, rebuild SQLite on content change). Needed to unblock 2.8.
3. **2.8** — dogfood: Claude Code writes posts via MCP, verifies graph updates.
4. VRA Lab: vra-8 (search, Pagefind) and vra-9 (hover previews) are high-visibility.

## Active blockers

- mem-1 depends on 2.5 — **now unblocked** (2.5 completed this session)
- mem-3 depends on 2.5 — **now unblocked**
- 2.8 depends on 2.7 — file watcher still pending

## Important context

- MCP server: `packages/mcp-server/src/` — McpServer high-level API, stdio transport
- `suggest_links` uses tag overlap (not embeddings) — semantic search is 3.7, can swap later
- KnowledgeLayout provenance panel renders raw frontmatter — needs wikilink resolution eventually
- Site live at: https://www.vra-lab.tech (Railway, auto-deploys from release/vra-lab)
- Railway filesystem ephemeral — admin UI posts lost on redeploy (mem-1 territory)
- Devlog numbering gaps (1-4, 1-5, 1-10 missing) — gap detection tool idea, not yet on board
>>>>>>> develop
