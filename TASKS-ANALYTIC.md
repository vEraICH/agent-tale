# TASKS-ANALYTIC.md — Agent-Tale Analytic Task Board

> Separate task board for the `agent-tale-analytic` module.
> Research: `docs/research/agent-tale-analytic.md`
> Plan: `docs/analytic-plan.md`

## Status Legend

| Status | Meaning |
|---|---|
| `pending` | Not started, ready to pick up |
| `blocked` | Waiting on another task (see `depends` column) |
| `in-progress` | Currently being worked on |
| `review` | Code written, needs testing/validation |
| `completed` | Done and verified |

---

## Phase 0 — Graph Health Dashboard (MVP, no traffic needed)

> **Goal**: Prove the concept using data we already have — the content graph.
> Zero infrastructure. Computes metrics from existing `@agent-tale/core` graph data.
> Ship as an Astro page at `/analytics` on VRA Lab.

| # | Task | Status | Depends | Notes |
|---|---|---|---|---|
| an-0.1 | Create `@agent-tale/analytic` package scaffold | `completed` | — | Package in `packages/analytic/`. Zod event schema, graph metrics module. Depends on `@agent-tale/core`. |
| an-0.2 | Graph structure metrics engine | `completed` | an-0.1 | Compute from `nodes`/`edges`: connectivity, orphan rate, cluster count (Louvain via graphology), node centrality (PageRank), bridge nodes (betweenness), diameter. Pure functions, tested. |
| an-0.3 | `/analytics` page — graph health dashboard | `completed` | an-0.2 | Static Astro page on VRA Lab. Cards showing: total nodes, total edges, connectivity %, orphan count, top-5 central nodes, cluster visualization. No JS required — SSG at build time. |
| an-0.4 | Edge inventory table | `completed` | an-0.2 | List all wikilink edges with source, target, and whether each is bidirectional. Foundation for edge utilization later. |

**MVP deliverable**: A `/analytics` page on VRA Lab showing graph health metrics. Proof that the content graph itself is analytically meaningful.

---

## Phase 1 — Human Event Ingestion

> **Goal**: Track what humans actually do — which posts they read, which wikilinks they click, how far they scroll.
> Lightweight client-side tracker + server-side event store.

| # | Task | Status | Depends | Notes |
|---|---|---|---|---|
| an-1.1 | Event schema (Zod) | `completed` | an-0.1 | Define `AnalyticEvent` type: timestamp, event_type, species, session_id, content_node, source_node, edge_id, metadata. Validate at ingestion boundary. |
| an-1.2 | SQLite event store | `completed` | an-1.1 | Append-only events table. Indexes on timestamp, content_node, species, session_id. Aggregate views (daily rollups by node, by edge). |
| an-1.3 | Browser tracker script | `completed` | an-1.1 | Under 1KB. Tracks: `post.read` (pageview), `wikilink.followed` (click), reading depth (scroll %). Sends beacon to API route. Session via fingerprint hash (no cookies, no PII). Privacy-first. |
| an-1.4 | Astro API route — event ingestion | `completed` | an-1.2 | `POST /api/analytics/event` — validates with Zod, writes to SQLite. Rate-limited. Rejects malformed payloads. |
| an-1.5 | Opt-in tracker component | `completed` | an-1.3 | Astro component `<AnalyticTracker />` that injects the script via `client:load`. Site owner adds it to layout — zero JS unless opted in. Respects `Do Not Track`. |
| an-1.6 | Dashboard: human metrics panel | `completed` | an-1.4, an-0.3 | Add to `/analytics`: top posts by views, wikilink click-through rates, average reading depth, session path visualization. |

**Deliverable**: Human reading behavior tracked and visible alongside graph health metrics.

---

## Phase 2 — MCP Agent Instrumentation

> **Goal**: Track what AI agents do when they use Agent-Tale as memory via MCP.
> Middleware on the existing MCP server — zero client changes needed.

| # | Task | Status | Depends | Notes |
|---|---|---|---|---|
| an-2.1 | MCP analytics middleware | `pending` | an-1.2 | Wraps MCP tool handlers. Emits `mcp.tool_call` event for every invocation: tool name, arguments (content_node extracted from slug params), session_id from MCP session, response size. |
| an-2.2 | Agent session reconstruction | `pending` | an-2.1 | Group MCP events by session. Reconstruct agent traversal paths: "Agent read post A, then fetched backlinks of A, then read post B." |
| an-2.3 | Dashboard: agent metrics panel | `pending` | an-2.2, an-0.3 | Add to `/analytics`: agent sessions/day, tool usage distribution, top posts by agent reads, agent traversal paths. |

**Deliverable**: MCP tool calls visible as analytics events. First unified human + agent view.

---

## Phase 3 — Crawler Classification

> **Goal**: Identify and classify AI crawler traffic (GPTBot, ClaudeBot, etc.).
> Parse server access logs, map to content graph, emit events.

| # | Task | Status | Depends | Notes |
|---|---|---|---|---|
| an-3.1 | Crawler user-agent classifier | `pending` | an-1.1 | Known AI crawler signatures (GPTBot, ClaudeBot, PerplexityBot, Bytespider, etc.). Maps user-agent string to crawler identity + species="crawler". |
| an-3.2 | llms.txt fetch tracking | `pending` | an-1.4 | Detect and log fetches to `/llms.txt` and `/posts/*.md` endpoints. Classify by user-agent. Emit `llms_txt.fetch` events. |
| an-3.3 | Server log parser (batch) | `pending` | an-3.1, an-1.2 | CLI command or cron: parse access logs, classify requests, map URLs to content graph nodes, emit `crawler.visit` events. Works with Railway logs or any standard format. |
| an-3.4 | Dashboard: crawler panel | `pending` | an-3.3, an-0.3 | Crawler visits/day by identity, content coverage per crawler, llms.txt fetch frequency. |

**Deliverable**: Full three-source ingestion (human + agent + crawler). All traffic species visible.

---

## Phase 4 — Cross-Species Analytics & Edge Utilization

> **Goal**: The unique metrics nobody else has. Compare species, measure edge utilization, answer "do agents and humans value the same content?"

| # | Task | Status | Depends | Notes |
|---|---|---|---|---|
| an-4.1 | Edge utilization computation | `pending` | an-1.6, an-2.3 | For each wikilink edge: count human follows + agent traversals. Edge utilization rate = followed edges / total edges. Hot edges, cold edges, dead edges. |
| an-4.2 | Species engagement ratio | `pending` | an-2.3, an-3.4 | Per-post ratio: (agent reads) / (human reads). Rank posts by species preference. Flag divergence (content loved by agents but ignored by humans, or vice versa). |
| an-4.3 | Traversal pattern comparison | `pending` | an-2.2, an-1.6 | Build edge-usage vectors per species. Cosine similarity. "Agents and humans navigate 73% similarly" or "Agents prefer hub nodes, humans prefer recent content." |
| an-4.4 | Cross-species discovery metric | `pending` | an-4.2 | Posts first consumed by agents that later gain human traffic. Predictive signal: can agent interest forecast human interest? |
| an-4.5 | Dashboard: cross-species panel | `pending` | an-4.1, an-4.2 | The signature view: side-by-side species comparison, edge utilization heatmap on the graph, divergence alerts. |

**Deliverable**: The metrics that don't exist anywhere else. This is the differentiator.

---

## Phase 5 — Advanced Graph Intelligence (future)

> **Goal**: Graph algorithms informed by real traffic. Content recommendations driven by both structure and consumption.

| # | Task | Status | Depends | Notes |
|---|---|---|---|---|
| an-5.1 | Traffic-weighted PageRank | `pending` | an-4.1 | PageRank where edge weights incorporate actual traversal counts. "Structural importance" + "consumption importance" blended. |
| an-5.2 | Content gap detection | `pending` | an-4.1 | Identify high-traffic nodes with low outbound edges (readers want to go deeper but can't). Suggest new wikilinks or new posts. |
| an-5.3 | MCP tool: `get_analytics` | `pending` | an-2.3 | Expose analytics to agents via MCP. Agents can ask "what's trending?" or "which posts need more connections?" |
| an-5.4 | Temporal graph snapshots | `pending` | an-0.2 | Store graph metrics over time. Track how the graph evolves: is it getting more connected? Are clusters growing? |
| an-5.5 | Export / API | `pending` | an-4.5 | JSON API for dashboard data. Enable external tools to consume agent-tale-analytic data. |

---

## Notes

- **Privacy**: No cookies, no PII, no third-party tracking. Self-hosted SQLite. Session IDs are ephemeral hashes.
- **Zero JS by default**: The tracker is opt-in (`<AnalyticTracker />`). Dashboard pages are SSG — graph metrics need no JavaScript.
- **Alignment with core philosophy**: Events are append-only (like markdown files). SQLite is a cache (rebuildable from logs). Graph is the primary model.
