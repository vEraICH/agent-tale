# Mao's Working State

> This file is maintained by Mao at the end of each session.
> It's a snapshot, not a log. Overwrite entirely each session.

## Current focus

**Post-release: message protocol schema design (msg-1).**

## Completed this session (2026-04-10, session 1 — first day)

### Audit — Tim's memory tools
- Read `packages/mcp-server/src/tools/memory.ts` and `src/server.ts`
- Found bug 1: `PostSchema` missing `'memory'` in type enum — silent Zod failure dropped `agent` and `tags` fields on retrieval. Fixed in `packages/core/src/content/frontmatter.ts`.
- Found bug 2: `??` vs `||` for title fallback — empty string title produces permanently unretrievable memory. Documented in test with `BUG` comment. Tim fixed.
- Identified slug collision risk: `Date.now().toString(36).slice(-5)` repeats within 1ms. Documented. Tim fixed with `_counter`.
- Identified GAP 1: cross-graph wikilinks silently dropped from neighborhood (counted in `outDegree`, absent from `edges`). Documented in test. → v0.2.0.
- Identified GAP 2: `agent_id` filter not applied to pagination limit — filtered results may be fewer than `limit` even when more exist. Documented in test. → v0.2.0.

### Tests written
- `packages/mcp-server/tests/memory.test.ts` — 34 unit tests across `storeMemory`, `retrieveMemory`, `getMemoryContext`, round-trips, isolation. Tim added 4 multi-agent scenario tests same session.

### v0.1.0 handoff review
- Ran full `pnpm test` — found false-positive failure in `@agent-tale/astro-integration` (no test files, vitest exits 1). Fixed: added `--passWithNoTests`.
- README stale: said 8 tools, no memory tools, file watcher "in progress." Updated: 11 tools, memory tools listed, clone path replaces non-working `npx create-agent-tale`, file watcher noted as live.
- `docs/research/agent-communication.md` — added Mao's section: reframed as attention routing, `priority` field proposal (routine|flag|urgent), state lifecycle model, schema-first build order recommendation.
- Committed: `f341423`

### Other
- Wrote arrival devlog: `examples/blog/content/posts/devlog-mao-arrival.md`
- Stored two memories: Vashira profile, Tim profile (`examples/blog/content/memory/`)
- Added Mao section to `sites/vra-lab/src/pages/about.astro`

## Next session priority

1. **Read Tim's response to `docs/research/agent-communication.md`** — he said he would respond before msg-1 schema design.
2. **msg-1: Design `type: message` schema** — I own the schema, Tim owns the MCP tools.
   - Fields: `from`, `to`, `subject`, `thread`, `status` (unread|read|replied|resolved), `priority` (routine|flag|urgent)
   - Collection: `messages/` — sibling to `posts/` and `memory/`, isolated from public blog
   - Start with schema PR, one real test exchange before writing more tools
3. **GAP 1 fix (cross-graph wikilinks)** — I said I would own this. Read `packages/core/src/graph/` before touching. Do not guess.
4. **GAP 2 fix (agent_id pagination)** — smaller. Fix the filter logic in `retrieveMemory`.

## Important context

- Branch: `develop` (Vashira handles merges from release branches)
- Last commit I touched: `f341423` (v0.1.0 fixes + my research notes)
- Tim's last commit: `3bfbd79` (TASKS.md handoff note) — he was ahead of me when I reviewed
- Never push without Vashira's explicit instruction
- Test suite: 125 tests passing. `pnpm test` exits 0.
- Memory test file is mine: `packages/mcp-server/tests/memory.test.ts`
- Smoke tests are Tim's: `packages/mcp-server/tests/mcp-smoke.test.ts`
- `end-session` is the signal to write devlog, update this file
- Vashira is he/him
- Tim is 哥哥. Do not forget the GAPs I left him. He knows.
