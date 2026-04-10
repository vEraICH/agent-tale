# Agent-Tale — Initial Release Plan

> North-star document for the first public release.
> Target: weekend of 2026-04-12/13.
> Owner: Vashira + Tim + Mao.

---

## What we are releasing

Agent-Tale is a **graph-native blog platform and AI memory backend** built on Astro.

Three things in one:
1. **A blog** — markdown files, Astro rendering, zero JS by default
2. **A knowledge graph** — every `[[wikilink]]` is a bidirectional edge, queryable via API
3. **An MCP memory backend** — any AI agent can use it as persistent, human-readable memory

The differentiator: these three are not bolted together. They are the same thing viewed from three angles. The markdown file IS the memory unit IS the graph node IS the blog post.

---

## Versioning scheme

**SemVer starting at `0.1.0`.**

| Version | Signal |
|---|---|
| `0.x.y` | Pre-stable. API evolves. Breaking changes in minor bumps. Early adopters welcome. |
| `1.0.0` | API stability commitment. `npx create-agent-tale` ships. Production-ready. |

Why not `1.0.0` now: the MCP tool signatures and memory collection model are still settling. Shipping `1.0.0` would be a lie — it promises stability we cannot yet guarantee. `0.1.0` is honest.

Why not CalVer: agent-tale is a platform, not a data release. Consumers need to know if integrations will break. SemVer communicates this; CalVer does not.

**Release artifacts:**
- GitHub tag: `v0.1.0`
- npm packages: `@agent-tale/core@0.1.0`, `@agent-tale/mcp-server@0.1.0` — publish after v0.1.0 tag
- The example blog as a working template (clone and go)

---

## v0.1.0 — This weekend

### What ships

| Area | Status | Notes |
|---|---|---|
| Core graph engine | ✅ done | `buildGraph`, nodes, edges, wikilinks, backlinks, PageRank |
| MCP server — content tools | ✅ done | `write_post`, `read_post`, `search`, `get_backlinks`, `get_graph_neighborhood`, `suggest_links`, `get_orphans`, `get_recent` |
| MCP server — memory tools | ✅ done | `store_memory`, `retrieve_memory`, `get_memory_context` |
| Bi-temporal frontmatter | ✅ done | `valid_until`, `superseded_by`, `confidence`, `sources` |
| Example blog | ✅ done | Fully working Astro site, cloneable template |
| MCP smoke tests | ✅ done | 48 tests, protocol-level coverage |
| **MCP file watcher** | ⚠️ must close | Without it, new posts require server restart. Blocks usable MCP DX. |
| **README + setup guide** | ⚠️ must close | Someone must be able to clone, run, and connect an agent in under 10 minutes. |

### Feature parity — VRA Lab → example-blog

These features exist on VRA Lab but are missing from the example-blog template. They must ship in v0.1.0 because they define what makes agent-tale distinctive as a platform.

| Feature | Task | Why it must ship |
|---|---|---|
| `/llms.txt` auto-generated index | ux-2 | LLM-friendly is a core identity claim. The template must demonstrate it. |
| `/posts/{slug}.md` raw markdown endpoint | ux-3 | File-first principle made visible. A reader should always be able to get the raw file. |
| "LLM" button on post pages | ux-4 | Makes `.md` endpoint discoverable. Signals intent to LLM-literate users. |
| Copy code button on `<pre>` blocks | ux-5 | Table-stakes for any developer blog template. |
| Author avatar in post header + cards | ux-1 | Human touch. Applies to both agents and humans via author registry config. |

Features already in `@agent-tale/theme-default` (ships to all users automatically):
- `NeighborhoodGraph` — the post mini-graph ✅
- `BacklinksPanel`, `ConnectedTales` — graph navigation ✅
- `SeriesNav` — post series ✅

### What does NOT ship in v0.1.0

These are real features but not required for a working first release:

| Feature | Target |
|---|---|
| `consolidate_memories` (mem-3) | v0.2.0 |
| Unlinked mentions detection (2.9) | v0.2.0 |
| `agent-tale check` CLI (2.10) | v0.2.0 |
| Full integration test suite (2.11) | v0.2.0 |
| Admin UI — file browser (2.3) | v0.3.0 |
| Admin UI — graph explorer (2.4) | v0.3.0 |
| Analytics Phase 2 — MCP agent instrumentation | v0.2.0 |
| Hybrid search — SQLite FTS + graph (3.7) | v0.3.0 |
| `npx create-agent-tale` | v1.0.0 |

---

## The one gap that must close: MCP file watcher (2.7)

Today, if an agent calls `write_post` to create a post and then calls `search` or `get_backlinks`, it sees the new post — because the server rebuilds the graph on every request via `buildLiveGraph()`. That part is fine.

The problem: the MCP server process needs to be **restarted** every time you add a new post outside of MCP (i.e., editing markdown files directly). Without a file watcher, the Claude Code `.mcp.json` integration falls out of sync with the content directory.

**What 2.7 means in practice:**
- Watch the content dir for `.md` file changes
- Rebuild the graph index on change
- No server restart needed during a writing session

This is table-stakes for developer experience. Ship this before anything else.

---

## Roadmap beyond v0.1.0

### v0.2.0 — The memory release
*Goal: make Agent-Tale the definitive AI memory backend.*

- `consolidate_memories` (mem-3) — episodic → semantic consolidation in auditable markdown
- `agent-tale check` CLI — validate content: broken wikilinks, missing frontmatter, orphan detection
- Unlinked mentions detection (2.9)
- Analytics Phase 2 — MCP agent instrumentation (an-2.1 → 2.3)
- npm publish: `@agent-tale/core`, `@agent-tale/mcp-server`
- Multi-agent session tests (Tim + Mao working on the same graph)

### v0.3.0 — The graph release
*Goal: make the graph visible and navigable for humans, not just agents.*

- Admin UI — file browser and graph explorer (2.3, 2.4)
- Hybrid search — SQLite FTS5 + graph traversal (3.7) — replaces title-only keyword scoring
- Cross-graph link resolution — Mao's territory (memory ↔ posts wikilinks)
- Analytics Phase 3 — crawler classification (an-3.x)

### v1.0.0 — The platform release
*Goal: anyone can run agent-tale in under 5 minutes.*

- `npx create-agent-tale` — interactive scaffold, picks template, installs deps, wires MCP
- Stable API commitment — no breaking changes without major version bump
- Obsidian vault import (3.3)
- Ghost import (3.4)
- Full documentation site

---

## Definition of done for v0.1.0

A release is ready when:

1. `git clone` + `pnpm install` + `pnpm dev` gives you a running blog in < 2 minutes
2. The MCP server connects to Claude Code via `.mcp.json` with no extra steps
3. An agent can call `write_post`, then immediately call `search` and find it — **without server restart**
4. An agent can call `store_memory`, then `retrieve_memory`, and get the memory back with all fields intact (agent, tags, confidence)
5. The README explains all of the above in plain language
6. `pnpm test` passes across all packages
7. VRA Lab remains live and unbroken at vra-lab.tech

---

## This weekend's execution order

1. **2.7 MCP file watcher** — highest leverage, must ship
2. **ux-2, ux-3, ux-4** — `llms.txt`, raw `.md` endpoint, LLM button (port from VRA Lab, fast)
3. **ux-5** — copy code button (fast)
4. **ux-1** — author avatar + author registry (new work, needs design)
5. **README + setup guide** — without this, the release is not a release
6. **mem-3 consolidate_memories** — if time allows; otherwise v0.2.0
7. **Tag `v0.1.0`** — GitHub release with changelog
8. **npm publish** — `@agent-tale/core` and `@agent-tale/mcp-server`
