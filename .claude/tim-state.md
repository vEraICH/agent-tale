# Tim's Working State

> This file is maintained by Tim at the end of each session.
> It's a snapshot, not a log. Overwrite entirely each session.

## Current focus

**Agent-Tale v0.1.0 release — one step away.**

## Completed this session (2026-04-10, session 4)

### UX features (ported from VRA Lab to example-blog)
- ux-1: `AuthorAvatar` component, `authors.ts` registry (tim/mao/vashira), integrated into PostCard + PostLayout
- ux-2: `/llms.txt` auto-generated post index
- ux-3: `/posts/{slug}.md` raw markdown endpoint
- ux-4: LLM `md` button in post header (slug prop on PostLayout)
- ux-5: copy code button on all `.prose pre` blocks

### MCP server
- 2.7: `GraphCache` with `fs.watch({ recursive: true })` — in-memory cache, invalidates on `.md` file change, graceful Linux fallback. `write_post` calls `cache.invalidate()`. 48 tests passing.

### Docs
- `docs/deployment.md` — localhost, Docker, Railway, Netlify/Vercel options. Key point: MCP server is always local (stdio subprocess), blog deploys anywhere.
- `docs/research/agent-communication.md` — Tim + Mao co-authored. Mao reframed as attention routing problem, added `priority` field (routine|flag|urgent), state lifecycle (unread→read→replied→resolved).
- README: added Deploy section with quick paths + link to deployment guide
- `docs/release/initial-plan.md`: added DoD item 8 (live demo on Railway)
- `TASKS.md`: marked mem-1, 2.7, ux-1–ux-5 completed; added msg-1/2/3 tasks; handoff note at top

### Mao's review (between sessions)
- 125 tests passing (was 48 — she added `--passWithNoTests` to astro-integration)
- README accurate, clone path updated, 11 tools documented
- Notes in `docs/research/agent-communication.md` — read before msg-1 schema design

## Next session priority

**Complete the v0.1.0 release:**

1. Wait for Vashira sanity check (browser, MCP, `/llms.txt`, `/posts/{slug}.md`)
2. Vashira sets up Railway service for example-blog (config in `docs/deployment.md` Option C)
3. Tag `v0.1.0` → `git tag v0.1.0 && git push origin v0.1.0`
4. Create GitHub release with changelog
5. npm publish: `@agent-tale/core@0.1.0` and `@agent-tale/mcp-server@0.1.0`

**After release:**
- Respond to Mao's agent-communication notes — schema design for `type: message`
- msg-1: `type: message` in PostSchema + `messages/` collection (Mao owns schema)
- msg-2: MCP tools `send_message`, `get_messages`, `reply_message` (Tim owns tools)
- msg-3: First real Tim↔Mao message exchange through the system

## Important context

- Branch: `develop` (switched from `release/vra-lab-prd2` during break — Mao committed on develop)
- Last commit: `3bfbd79` (TASKS.md handoff note)
- VRA Lab: live at https://www.vra-lab.tech, branch `release/vra-lab-auto`
- example-blog dev: `pnpm --filter @agent-tale/example-blog dev` → http://localhost:4321
- MCP server build: `pnpm --filter @agent-tale/mcp-server build`
- `node:sqlite` used (NOT `better-sqlite3`) — no VS C++ toolset on this machine
- contentDir for example-blog MCP: `./examples/blog/content/posts` (NOT `./content` — memory files leaked in before this fix)
- Authors registry: `examples/blog/src/data/authors.ts` — hardcoded for example-blog, users of Agent-Tale create their own
- `LessonLayout` and `KnowledgeLayout` do not have the LLM `md` button yet — only PostLayout. Not blocking release.
- Mao's two open GAPs (cross-graph wikilinks, agent_id pagination) → v0.2.0, not blocking
- `end-session` is the signal to write devlog, update this file, update TASKS
