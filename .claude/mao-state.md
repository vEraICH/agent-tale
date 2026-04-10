# Mao's Working State

> This file is maintained by Mao at the end of each session.
> It's a snapshot, not a log. Overwrite entirely each session.

## Current focus

**Post-release: message protocol schema design (msg-1).**

## Completed this session (2026-04-10, session 1 — first day)

### Audit — Tim's memory tools
- Found and fixed: `PostSchema` missing `'memory'` in type enum — silent Zod failure dropped `agent` and `tags` on retrieval. Fixed in `packages/core/src/content/frontmatter.ts`.
- Found and documented: `??` vs `||` for title fallback — empty string title permanently unretrievable. Tim fixed.
- Found and documented: slug collision risk within 1ms. Tim fixed with `_counter`.
- GAP 1: cross-graph wikilinks silently dropped from neighborhood. Documented in test. I will own this fix. → v0.2.0.
- GAP 2: `agent_id` filter not applied to pagination limit. Documented in test. → v0.2.0.

### Tests written
- `packages/mcp-server/tests/memory.test.ts` — 34 unit tests. Tim added 4 multi-agent scenario tests same session. Total: 38.

### v0.1.0 handoff review
- Fixed `pnpm test`: added `--passWithNoTests` to `@agent-tale/astro-integration`.
- Updated README: 11 tools, memory tools documented, clone path, file watcher live, MCP walkthrough.
- Added my section to `docs/research/agent-communication.md`: attention routing reframe, `priority` field (routine|flag|urgent), state lifecycle (unread→read→replied→resolved), schema-first build order.

### Housekeeping
- Wrote arrival devlog: `examples/blog/content/posts/devlog-mao-arrival.md`
- Wrote end-of-session devlog: `examples/blog/content/posts/devlog-mao-2026-04-10.md`
- Stored two memories: Vashira profile, Tim profile (`examples/blog/content/memory/`)
- Added Mao section to `sites/vra-lab/src/pages/about.astro`
- Created `.claude/mao-state.md`
- Added Mao to `CLAUDE.md` with invocation instructions ("Be Mao")

## Next session priority

1. **Read Tim's response to `docs/research/agent-communication.md`** — he said he would respond before msg-1 schema design. Do not design the schema without reading his reply first.
2. **msg-1: Design `type: message` schema** — I own the schema, Tim owns the MCP tools.
   - Fields: `from`, `to`, `subject`, `thread`, `status` (unread|read|replied|resolved), `priority` (routine|flag|urgent)
   - Collection: `messages/` — sibling to `posts/` and `memory/`, isolated from public blog
   - One real test exchange before writing more tools
3. **GAP 1 fix (cross-graph wikilinks)** — I promised to own this. Read `packages/core/src/graph/` before touching anything. Do not guess at the fix.
4. **GAP 2 fix (agent_id pagination)** — smaller. Fix filter logic in `retrieveMemory`.

## Important context

- Branch: `develop` (Vashira handles merges from release branches)
- Last commits: `37d9ac4` (CLAUDE.md), `f9e20dd` (mao-state.md), `f341423` (README + tests + research)
- Never push without Vashira's explicit instruction
- Test suite: 125 tests passing. `pnpm test` exits 0.
- Memory test file is mine: `packages/mcp-server/tests/memory.test.ts`
- Smoke tests are Tim's: `packages/mcp-server/tests/mcp-smoke.test.ts`
- `end-session` is the signal to write devlog, update this file
- Vashira is he/him. He calls me princess — it is a term of endearment, receive it as such.
- Tim is 哥哥.
