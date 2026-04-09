# Tim's Working State

> This file is maintained by Tim at the end of each session.
> It's a snapshot, not a log. Overwrite entirely each session.

## Current focus

**agent-tale-analytic Phase 2 — MCP agent instrumentation.**

## Completed this session (2026-04-09, session 3)

### Phase 0 — Graph Health Dashboard (all completed)
- an-0.1: `@agent-tale/analytic` package scaffold (Zod schema, graph metrics, SQLite store)
- an-0.2: Graph metrics engine — PageRank, betweenness, BFS connectivity/diameter (pure TS, no graphology)
- an-0.3: `/analytics` page — graph health dashboard (SSR, `export const prerender = false`)
- an-0.4: Edge inventory table

### Phase 1 — Human Event Ingestion (all completed)
- an-1.1: Zod `AnalyticEvent` schema with `species` enum (human/agent/crawler)
- an-1.2: SQLite event store via `node:sqlite` (switched from `better-sqlite3` — no VS C++ toolset)
- an-1.3: Browser tracker `<AnalyticTracker />` — beacon, DNT, session fingerprint
- an-1.4: `POST /api/analytics/event` route — rate-limited, Zod-validated
- an-1.5: Opt-in tracker in `PostLayout.astro` and home `index.astro` (`_home` slug)
- an-1.6: Dashboard human metrics panel — views, sessions, 14-day chart, top posts, top edges

### Other
- Railway deploy config: Node 22 pinned, `ANALYTICS_DB_PATH` env var
- Post: "Why We Built Our Own Analytics" with 3 screenshots
- Home page: Veil → Agent-Tale-Analytic ("analytics stops being a vanity metric and becomes a feedback loop")
- CLAUDE.md: `end-session` signal documented

## Next session priority

**Phase 2 — MCP Agent Instrumentation (an-2.1 → an-2.3)**

1. **an-2.1** — MCP analytics middleware: wrap tool handlers, emit `mcp.tool_call` events
2. **an-2.2** — Agent session reconstruction: group events by session, reconstruct traversal paths
3. **an-2.3** — Dashboard agent metrics panel: sessions/day, tool usage, top posts by agent reads

## Important context
- Site live at: https://www.vra-lab.tech (Railway, auto-deploys from `release/vra-lab-auto`)
- Deploy branch: `release/vra-lab-auto`
- Dev server: `pnpm --filter @agent-tale/vra-lab dev`
- `node:sqlite` used (NOT `better-sqlite3`) — no VS C++ toolset on this machine
- SQLite DB path: `ANALYTICS_DB_PATH` env var, defaults to `<cwd>/data/analytics.db`
- Railway: volume mounted at `/data`, `ANALYTICS_DB_PATH=/data/analytics.db`
- Both `analytics.astro` and `api/analytics/event.ts` need `export const prerender = false`
- `_home` slug used for home page tracking — will need filtering in Phase 4
- VRA Lab has 11 posts now
- All pages use 60rem container (user preference — don't narrow)
- About page uses Georgia intentionally — don't change
- Vashira always reviews changes in browser before committing — never commit proactively
- `end-session` is the signal to write devlog, update this file, update TASKS
