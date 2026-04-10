# CLAUDE.md — Agent-Tale

> A graph-native blog platform where every markdown file is a tale, every wikilink is a connection, and every agent has a story to tell.

## What is this?

Agent-Tale is a TypeScript blog platform built on Astro. It treats `.md/.mdx` files as first-class citizens, models content as a **bidirectional knowledge graph** via `[[wikilinks]]`, and exposes an **MCP server** so AI agents can use the blog as persistent memory.

## Agent: Tim

This project's primary builder is **Tim** — defined in `.claude/agents/tim.md`. Tim has persistent memory across sessions via devlog posts and a working state file.

When starting a session, Tim should:
1. Read `SOUL.md` for personality
2. Read `.claude/tim-state.md` for where he left off
3. Read recent devlog posts (`examples/blog/content/posts/devlog-*.md`) for context
4. Read `TASKS.md` for what to do next

When ending a session, Tim should:
1. Write a devlog post about what he built
2. Update `.claude/tim-state.md` with current state
3. Update `TASKS.md` status column

> **Session end signal**: When Vashira says `end-session`, that is the explicit trigger to perform the above steps before closing. Devlog posts go in `examples/blog/content/posts/devlog-*.md` — NOT in `sites/vra-lab/content/posts/`.

## Agent: Mao

The project's MCP specialist and tester is **Mao** — defined in `.claude/agents/mao.md`. Mao has persistent memory across sessions via her working state file.

To invoke Mao for a session, say **"Be Mao"** at the start.

When starting a session, Mao should:
1. Read `.claude/agents/mao.md` for personality and mental model
2. Read `.claude/mao-state.md` for where she left off

When ending a session, Mao should:
1. Write a devlog post about what she found or built
2. Update `.claude/mao-state.md` with current state

> **Session end signal**: Same as Tim — when Vashira says `end-session`, perform the above steps before closing.

## Quick orientation

| Doc | What it covers |
|---|---|
| `TASKS.md` | **Start here.** Kanban-style task board with status columns. |
| `TASKS-ANALYTIC.md` | Task board for `agent-tale-analytic` module (graph-native, species-aware analytics). |
| `docs/analytic-plan.md` | Phased implementation plan for agent-tale-analytic |
| `docs/research/agent-tale-analytic.md` | Competitor analysis and niche research for agent-tale-analytic |
| `docs/architecture.md` | System architecture, layer diagram, tech stack decisions |
| `docs/content-model.md` | Frontmatter schema, wikilink syntax, graph data model |
| `docs/monorepo-structure.md` | Package layout, file tree, dependency graph between packages |
| `docs/mcp-server.md` | MCP tool definitions, agent usage patterns |
| `docs/dogfooding.md` | How to test Agent-Tale with Claude Code as the first user |
| `docs/testing.md` | Test strategy, fixture patterns, harness design |
| `docs/conventions.md` | Code style, naming, commit messages, PR process |
| `docs/roadmap.md` | Phased roadmap beyond MVP |

## Core mental model

```
.md files on disk  ──→  Content Graph Engine  ──→  Four consumers:
                         (the shared core)          1. Astro renderer (public website)
                                                    2. Admin UI (human editing)
                                                    3. MCP server (AI agent memory)
                                                    4. Analytic module (graph-native analytics)
```

## Tech stack (short version)

- **Astro** (hybrid mode) — rendering core
- **SQLite** — graph index cache (rebuildable from files)
- **Zod** — content schema validation
- **Remark plugins** — wikilink parsing, backlinks, reading time
- **React islands** — admin UI only, zero JS on public pages
- **MCP SDK** — agent integration
- **pnpm + Turborepo** — monorepo management

## Key constraints

1. **Files are truth.** SQLite is a cache. Delete it, rebuild from `.md` files.
2. **Zero JS by default.** Public blog pages ship no JavaScript unless a component opts in with `client:*`.
3. **Incremental builds.** Use content hashes. Target <2s cold build for 500 posts, <100ms hot rebuild.
4. **Strict TypeScript.** No `any`. Zod for all external boundaries.

## How to work on this

1. Read `TASKS.md` — pick a task, change status to `in-progress`
2. Read the relevant `docs/*.md` for context on that task
3. Write code, write tests (see `docs/testing.md`)
4. Write a devlog post about what you built
5. Update `.claude/tim-state.md` and `TASKS.md` when done

**Do not read all docs upfront.** Read only what's relevant to the current task.

## Design Context

> Full design system details live in `.impeccable.md`. This is the short version for session context.

**Personality**: Curious · Connected · Alive — the graph is the product; design makes connections feel real.

**Aesthetic**: Lean into the graph. Node/edge motifs, spatial metaphors, graph-inspired layouts layer on top of a typography-first foundation. Not decorative — structural.

**Design principles**:
1. The graph is the product — every element either aids reading or reveals connections.
2. Restrained, not bare — spacing, rhythm, and color do the work.
3. Curious over complete — prefer designs that invite one step further.
4. Both light (amber) and dark (violet) modes are first-class — full parity.
5. Motion orients or delights — never decorates. Always respects `prefers-reduced-motion`.

**Accessibility**: WCAG AA minimum. Both themes pass contrast. Reduced motion respected.

**Anti-patterns**: Card shadows on posts, neon-on-dark AI aesthetics, dark mode as mere inversion, animations on static content.
