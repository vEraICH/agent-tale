# Tim's Working State

> This file is maintained by Tim at the end of each session.
> It's a snapshot, not a log. Overwrite entirely each session.

## Current focus

Two active tracks:
- **VRA Lab** — Sprints 1/2/2.5 complete. Sprint 3 (digital garden identity) is next.
- **Memory System** — MCP server (2.5 + 2.6) complete. mem-1, 2.7, 2.8 are next.

## Completed (combined across recent sessions)

### VRA Lab track
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
- Sprint 1 (vra-1 to vra-5): copy code button, prev/next nav, Shiki dual theme, reading progress bar, sticky TOC
- Sprint 2 (vra-6, vra-7): JSON-LD BlogPosting, dynamic OG images via Satori + resvg
- Sprint 2.5 (vra-15, vra-16, vra-17): /llms.txt, raw markdown endpoint, "md" button on post pages
- Gap analysis research doc: `docs/research/gap-analysis.md`
- VRA-Lab task board added to TASKS.md
- `.impeccable.md` updated with VRA Lab theme section
- Umami analytics setup guide written (`private-docs/deployment/vra-lab-umami.md`)

### Memory System / MCP track
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

## Blockers / open questions
- Root domain SSL: vra-lab.tech shows "Not secure" — GoDaddy forwarding doesn't support HTTPS. Need Cloudflare or Railway redirect (vra-18)
- vra-8 (Search/Pagefind) not started
- 2.8 depends on 2.7 — file watcher still pending

## Next session should start with
1. **mem-1** — memory-scoped MCP tool naming (`store_memory`, `retrieve_memory`, `get_memory_context`)
2. **2.7** — file watcher (chokidar in MCP server, rebuild SQLite on content change)
3. **2.8** — dogfood: Claude Code writes posts via MCP, verifies graph updates
4. **vra-8** — site-wide search (Pagefind)
5. **vra-9** — wikilink hover previews

## Important context
- Site live at: https://www.vra-lab.tech (Railway, auto-deploys from release/vra-lab)
- Railway service: `sites/vra-lab` (moved from `examples/vra-lab`)
- Deploy branch: `release/vra-lab`
- Root `railway.toml` paths updated for `sites/vra-lab`
- Dev server: `pnpm --filter @agent-tale/vra-lab dev`
- MCP server: `packages/mcp-server/src/` — McpServer high-level API, stdio transport
- `suggest_links` uses tag overlap (not embeddings) — semantic search is 3.7, can swap later
- KnowledgeLayout provenance panel renders raw frontmatter — needs wikilink resolution eventually
- Railway filesystem ephemeral — admin UI posts lost on redeploy (mem-1 territory)
- All pages use 60rem container (user preference — don't narrow sections)
- TOC sidebar shows at 1200px+ breakpoint
- `private-docs/` is gitignored — deployment guides live locally
- Satori + @resvg/resvg-js added as dependencies for OG images
- OG images generated at `/og/{slug}.png`
- llms.txt includes graph stats and connection counts
- Devlog numbering gaps (1-4, 1-5, 1-10 missing) — gap detection tool idea, not yet on board
