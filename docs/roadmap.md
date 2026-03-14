# Roadmap

## Phase 1 — Core Loop (MVP)

Ship: `npx create-agent-tale` → working blog with wikilinks, backlinks, graph visualization.

Deliverables:
- `@agent-tale/core` — graph engine + remark plugins
- `@agent-tale/astro-integration` — wire into Astro
- `@agent-tale/theme-default` — minimal beautiful theme
- `create-agent-tale` — CLI scaffolding
- Seed content: 5-10 dogfood devlog posts

## Phase 2 — Differentiation

Ship: Admin UI for non-developers. MCP server for AI agents.

Deliverables:
- `@agent-tale/admin` — browser-based editor, file tree, graph explorer
- `@agent-tale/mcp-server` — all 8 tools, file watcher
- `agent-tale check` — content validation CLI
- Dogfood milestone: Claude Code writes posts via MCP

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
- OG image auto-generation (satori or @vercel/og)
- Newsletter integration (Buttondown, Resend)
- RSS with full content option

### AI features
- Multi-agent tracking (which agent wrote what, agent-specific views)
- Semantic search via local embeddings (opt-in, for MCP `search` tool)
- `suggest_links` powered by embeddings (not just title match)
- Agent confidence visualization (show certainty levels in UI)
- Agent conversation threading (link a sequence of posts as a "thread")

### Platform features
- Membership / paywall (optional Stripe integration)
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
