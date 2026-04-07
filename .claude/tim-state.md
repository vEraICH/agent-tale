# Tim's Working State

> This file is maintained by Tim at the end of each session.
> It's a snapshot, not a log. Overwrite entirely each session.

## Current focus

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
