# Agent-Tale Analytic — Implementation Plan

> Graph-native, species-aware content analytics for Agent-Tale.
> Task tracking: `TASKS-ANALYTIC.md`
> Research: `docs/research/agent-tale-analytic.md`

## Vision

A single analytics module that sees all three species consuming content — humans (browser), agents (MCP), crawlers (server logs) — and models their behavior as walks on the content graph instead of linear funnels.

## Phased Delivery

### Phase 0 — Graph Health Dashboard (MVP)

**Effort**: Small. **Dependencies**: None — uses existing graph data.

The fastest path to a working deliverable. No event ingestion, no tracking scripts, no infrastructure. Just compute metrics from the content graph that `@agent-tale/core` already builds.

**What it proves**: The content graph itself is an analytically rich object. Graph health metrics (connectivity, orphan rate, centrality, clusters) are meaningful and novel — no other blog analytics tool shows these.

**Package**: `packages/analytic/` (`@agent-tale/analytic`)
- Depends on `@agent-tale/core` for graph data
- Uses `graphology` for graph algorithm computation (PageRank, Louvain community detection, betweenness centrality)
- Pure functions, fully tested, no side effects

**Output**: A `/analytics` page on VRA Lab showing graph health at build time. Static HTML, zero JavaScript.

**Key metrics**:
| Metric | Source | Computation |
|---|---|---|
| Total nodes / edges | `nodes`, `edges` from graph | Count |
| Graph connectivity | Graph traversal | % of nodes reachable from largest connected component |
| Orphan rate | `nodes` with `inDegree === 0` | Count / total |
| Top-5 central nodes | PageRank on graph | graphology-metrics PageRank |
| Bridge nodes | Betweenness centrality | graphology-metrics betweenness |
| Cluster count | Louvain community detection | graphology-communities-louvain |
| Graph diameter | BFS from each node | Longest shortest path |
| Edge inventory | All wikilink edges | Source → target with directionality |

### Phase 1 — Human Event Ingestion

**Effort**: Medium. **Dependencies**: Phase 0 for package + dashboard.

Add a lightweight (~1KB) opt-in tracking script that captures three events:
1. `post.read` — a human opened a post
2. `wikilink.followed` — a human clicked a wikilink (edge traversal!)
3. Reading depth — scroll percentage at exit

Events ship via `navigator.sendBeacon` to a server-side Astro API route that validates (Zod) and writes to SQLite.

**Design principles**:
- **Opt-in**: Site owner adds `<AnalyticTracker />` to their layout. Without it, zero JS ships (core constraint preserved).
- **Privacy-first**: No cookies. Session ID = hash(date + user-agent + screen-size). No PII stored. Respects `Do Not Track`.
- **Append-only**: Events table is insert-only. Materialized views compute rollups.

**Key addition to dashboard**: Human metrics panel — top posts by views, wikilink CTR, reading depth distribution, session graph walks.

### Phase 2 — MCP Agent Instrumentation

**Effort**: Small. **Dependencies**: Phase 1 for event store.

Wrap MCP tool handlers with analytics middleware. Every `read_post`, `get_backlinks`, `search`, etc. emits an event to the same SQLite store.

This is architecturally simple because:
- The MCP server already knows which content nodes are being accessed (slug parameters)
- MCP sessions provide natural session grouping
- No client-side changes needed — it's all server-side

**Key addition to dashboard**: Agent metrics panel — sessions/day, tool distribution, agent traversal paths, top posts by agent reads.

**Milestone**: First unified human + agent analytics view. This is where the "species-aware" story becomes real.

### Phase 3 — Crawler Classification

**Effort**: Medium. **Dependencies**: Phase 1 for event store.

Two sub-problems:
1. **Real-time**: Classify incoming requests to `/llms.txt` and `/posts/*.md` by user-agent (GPTBot, ClaudeBot, PerplexityBot). Emit events inline.
2. **Batch**: Parse server access logs periodically, classify all requests, map URLs to graph nodes.

Crawler user-agent database maintained as a simple JSON map — easy to update as new AI crawlers appear.

**Key addition to dashboard**: Crawler panel — visits by crawler identity, content coverage, llms.txt consumption frequency.

### Phase 4 — Cross-Species Analytics

**Effort**: Medium-Large. **Dependencies**: Phases 1-3 (all three ingestion paths).

The unique metrics that justify the module's existence:

- **Edge utilization**: Which wikilinks are actually followed? By whom? Hot edges, cold edges, dead edges.
- **Species engagement ratio**: Per-post `agent_reads / human_reads`. Which content is disproportionately consumed by one species?
- **Traversal pattern similarity**: Cosine similarity of edge-usage vectors per species. Do agents and humans navigate the graph differently?
- **Cross-species discovery**: Posts first found by agents that later gain human traffic. Predictive signal.

**Key addition to dashboard**: Cross-species panel with side-by-side comparison and edge utilization heatmap overlaid on the content graph.

### Phase 5 — Advanced Graph Intelligence

**Effort**: Large. **Dependencies**: Phase 4.

This is where analytics feeds back into content strategy:
- Traffic-weighted PageRank (structural + consumption importance blended)
- Content gap detection (high-traffic nodes with low outbound edges)
- `get_analytics` MCP tool (agents can ask "what's trending?")
- Temporal graph snapshots (how does graph health evolve over time?)

---

## Architecture

### Package: `@agent-tale/analytic`

```
packages/analytic/
  package.json              # depends on @agent-tale/core, graphology
  src/
    index.ts                # public API
    schema.ts               # Zod event schema (AnalyticEvent)
    store.ts                # SQLite event store (append-only)
    graph-metrics.ts        # graphology computations (Phase 0)
    species.ts              # human / agent / crawler classification
    aggregates.ts           # materialized view builders
    tracker.ts              # browser script source (Phase 1)
  __tests__/
    graph-metrics.test.ts
    schema.test.ts
    store.test.ts
    species.test.ts
```

### Event Schema

```typescript
interface AnalyticEvent {
  timestamp: string;           // ISO8601
  event_type:
    | "post.read"              // human or agent read a post
    | "wikilink.followed"      // human clicked or agent traversed a wikilink
    | "mcp.tool_call"          // agent used an MCP tool
    | "llms_txt.fetch"         // LLM fetched llms.txt or raw markdown
    | "crawler.visit";         // AI crawler hit a page
  species: "human" | "agent" | "crawler";
  session_id: string;
  content_node: string;        // post slug
  source_node?: string;        // previous post (for edge traversal)
  edge_id?: string;            // specific wikilink
  metadata: Record<string, unknown>;
}
```

### Integration Points

| Consumer | How it connects |
|---|---|
| VRA Lab site | `<AnalyticTracker />` component in layout (Phase 1). `/analytics` page imports graph metrics (Phase 0). |
| MCP server | Analytics middleware wraps tool handlers (Phase 2). |
| Server logs | CLI parser reads logs, writes to event store (Phase 3). |
| Dashboard | Astro pages read from SQLite aggregates (all phases). |

### Storage

SQLite, consistent with Agent-Tale's "files are truth, SQLite is cache" principle:
- **Events table**: append-only, indexed on (timestamp, content_node, species)
- **Aggregate views**: materialized on read or via periodic refresh
- **Graph snapshots**: serialized graphology state for temporal comparison

---

## Why This Order

1. **Phase 0 first** because it requires zero infrastructure and proves the graph-as-analytics-object thesis. Quick win, high novelty.
2. **Phase 1 next** because human tracking is table-stakes and validates the event ingestion pipeline.
3. **Phase 2 before Phase 3** because MCP instrumentation is simpler (server-side only, controlled environment) and delivers the "species-aware" story.
4. **Phase 3 after 2** because crawler classification is messier (log parsing, user-agent heuristics) and less controlled.
5. **Phase 4 is the payoff** — cross-species comparison only makes sense with all three sources.
6. **Phase 5 is aspirational** — advanced intelligence that feeds analytics back into content strategy.

---

## Open Questions

- **Dashboard tech**: Static SSG pages (aligned with zero-JS) or React island for interactive graph visualization? Could start static and add interactivity for Phase 4's edge heatmap.
- **Real-time vs. batch for Phase 1**: Beacon-to-SQLite is effectively real-time. Do we need a live dashboard, or is rebuild-on-deploy sufficient for MVP?
- **Crawler log access on Railway**: How to access and parse Railway access logs programmatically? May need a log drain to a file.
- **graphology bundle size**: graphology + algorithms is non-trivial. Since Phase 0 is SSG (build-time only), this is fine — it never ships to the browser.
