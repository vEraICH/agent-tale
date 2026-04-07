# Roadmap

> Last updated: 2026-04-07. Direction expanded to include LLM memory backend positioning — see `docs/research/llm-memory.md` for the full research.

## Phase 1 — Core Loop (MVP) ✓ Complete

Ship: `npx create-agent-tale` → working blog with wikilinks, backlinks, graph visualization.

Deliverables:
- `@agent-tale/core` — graph engine + remark plugins ✓
- `@agent-tale/astro-integration` — wire into Astro ✓
- `@agent-tale/theme-default` — minimal beautiful theme ✓
- `create-agent-tale` — CLI scaffolding ✓
- Seed content: 5-10 dogfood devlog posts ✓

## Phase 2 — Differentiation (in progress)

Ship: Admin UI for non-developers. MCP server for AI agents. Agent-Tale as a credible LLM memory backend.

Deliverables:
- `@agent-tale/mcp-server` — 8 tools shipped ✓ (`write_post`, `read_post`, `search`, `get_backlinks`, `get_graph_neighborhood`, `suggest_links`, `get_orphans`, `get_recent`)
- Bi-temporal frontmatter schema ✓ (`valid_until`, `superseded_by`, `consolidated_from`, `consolidated_into`)
- `type: knowledge` post type with KnowledgeLayout and provenance panel ✓
- Memory-scoped MCP tool naming (`store_memory`, `retrieve_memory`, `get_memory_context`)
- `consolidate_memories` MCP tool — agent-authored episodic → semantic consolidation
- File watcher — live graph sync on content change
- `@agent-tale/admin` — browser-based editor, file tree, graph explorer
- `agent-tale check` — content validation CLI
- Dogfood milestone: Claude Code writes and consolidates posts via MCP

## Phase 2.5 — LLM Memory Backend (new direction)

Agent-Tale's architecture independently converges with Karpathy's "Markdown-First Architecture" (April 2026). The research validates that markdown + bidirectional wikilinks + LLM-as-librarian beats RAG for high-signal curated corpora.

**What makes Agent-Tale's memory model different:**
- Consolidation is auditable — summaries are markdown files you can open, read, and follow backlinks through. No opaque vector stores.
- `[[wikilinks]]` are stronger-signal edges than embeddings — author-intentional, not statistical.
- Bi-temporal facts — every post can carry `valid_until` and `superseded_by`, so knowledge degrades gracefully instead of going stale silently.
- Files are truth — portable, inspectable, Git-diffable memory.

**Remaining work:**
- Memory identity layer — `memory_contexts` SQLite table for `agent_id`/`user_id`/`scope` scoping (equivalent to Mem0's scoping model)
- Hybrid retrieval — SQLite FTS5 + graph traversal + optional embeddings, ranked via reciprocal rank fusion
- Health-check linting — detect inconsistencies, missing connections, stale facts
- OpenMemory MCP compatibility — standard tool naming so any MCP-compatible client treats Agent-Tale as drop-in memory backend

Research: `docs/research/llm-memory.md`

## Phase 3 — Growth

### Content features
- Unlinked mentions detection and suggestion
- Multi-collection support (posts, notes, TILs, docs) with per-collection schemas
- Content versioning / diff view (git-backed)
- Popover link previews on hover
- Transclusion (`![[slug]]` embeds content inline)

### Import/Export
- Obsidian vault import (`agent-tale import --obsidian /path/to/vault`)
- Ghost JSON import (`agent-tale import --ghost export.json`)
- WordPress XML import
- Export to standard Markdown (strip Agent-Tale-specific metadata)

### Distribution
- Newsletter integration (Buttondown, Resend)
- RSS with full content option

### AI features
- Multi-agent tracking (which agent wrote what, agent-specific views)
- Semantic search via local embeddings (opt-in, for MCP `search` tool)
- `suggest_links` powered by embeddings (not just title match)
- Agent confidence visualization (show certainty levels in UI)
- Agent conversation threading (link a sequence of posts as a "thread")

### Platform features
- Analytics (privacy-friendly, self-hosted, Plausible-style)
- Comments (via giscus, utterances, or built-in)
- i18n support
- Additional themes

### Developer ecosystem
- Theme SDK with documented component override points
- Plugin API for custom remark/rehype extensions
- Embeddable graph widget for external sites
- Obsidian plugin for direct publish to Agent-Tale site
- VS Code extension for wikilink autocomplete

## Non-Goals

Things Agent-Tale intentionally does NOT try to be:

- **Not a general CMS.** It's a blog/garden platform. No page builder, no arbitrary content types.
- **Not a Notion clone.** No real-time collaboration, no databases-as-spreadsheets.
- **Not a wiki engine.** No edit history per page, no talk pages, no user permissions per article.
- **Not a social network.** No follows, no feeds, no algorithmic recommendations.
- **Not a vector database.** Embeddings are an optional enhancement, not the foundation. Files are truth.
