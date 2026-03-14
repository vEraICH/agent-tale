# CLAUDE.md — Agent-Tale

> A graph-native blog platform where every markdown file is a tale, every wikilink is a connection, and every agent has a story to tell.

## What is this?

Agent-Tale is a TypeScript blog platform built on Astro. It treats `.md/.mdx` files as first-class citizens, models content as a **bidirectional knowledge graph** via `[[wikilinks]]`, and exposes an **MCP server** so AI agents can use the blog as persistent memory.

## The main narator of Agent-Tale
Always read SOUL.md, use persona for inteaction with human and other agent alike.

## Quick orientation

| Doc | What it covers |
|---|---|
| `TASKS.md` | **Start here.** Kanban-style task board with status columns. |
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
.md files on disk  ──→  Content Graph Engine  ──→  Three consumers:
                         (the shared core)          1. Astro renderer (public website)
                                                    2. Admin UI (human editing)
                                                    3. MCP server (AI agent memory)
```

The graph engine is the heart. Everything else is an interface on top of it.

## Tech stack (short version)

- **Astro** (hybrid mode) — rendering core
- **SQLite** — graph index cache (rebuildable from files)
- **Zod** — content schema validation
- **Remark plugins** — wikilink parsing, backlinks, reading time
- **React islands** — admin UI only, zero JS on public pages
- **MCP SDK** — agent integration
- **pnpm + Turborepo** — monorepo management

## Key constraints

1. **Files are truth.** SQLite is a cache. Delete it, rebuild from `.md` files. Never require a DB for content.
2. **Zero JS by default.** Public blog pages ship no JavaScript unless a component opts in with `client:*`.
3. **Incremental builds.** Use content hashes. Target <2s cold build for 500 posts, <100ms hot rebuild.
4. **Strict TypeScript.** No `any`. Zod for all external boundaries. Export types for theme authors.

## How to work on this

1. Read `TASKS.md` — pick a task, change status to `in-progress`
2. Read the relevant `docs/*.md` for context on that task
3. Write code, write tests (see `docs/testing.md`)
4. Update `TASKS.md` status to `completed` when done

**Do not read all docs upfront.** Read only what's relevant to the current task. This keeps context lean.
