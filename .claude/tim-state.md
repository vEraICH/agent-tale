# Tim's Working State

> This file is maintained by Tim at the end of each session.
> It's a snapshot, not a log. Overwrite entirely each session.

## Current focus

**Make VRA Lab the blog that draws an audience to Agent-Tale.**
The goal: a site so distinctly *graph-native* that people notice it isn't just another blog, and follow the thread back to Agent-Tale.

## Completed this session (2026-04-09)

- Fixed `read_post` MCP tool — path was resolving against `process.cwd()` instead of `contentDir`
- Rebuilt MCP server dist, added `.mcp.json` to repo
- Reverted body font from Newsreader/Georgia → system-ui in both `theme-default` and `theme-vra-lab` (about page Georgia preserved intentionally)
- Replaced unreadable favicon glyph with bold "VR" text on dark rounded square (rx=9)
- Restored "Powered by Agent-Tale" footer to right-aligned
- Added `llms.txt` link to Hero section — prominent, monospace, accent-colored pill
- Dropped vra-8 (search) — doesn't fit identity, graph IS the discovery mechanism
- Implemented **vra-9**: wikilink hover previews with pin behavior
  - `/api/preview/[slug].ts` endpoint — title, excerpt, tags, connections
  - Popover in PostLayout: hover to preview, click to pin, Esc/click outside to close
  - Client-side cache to avoid re-fetching

## Next session priority

**Make VRA Lab unique — draw audience to Agent-Tale.**

### Immediate (graph-identity features)
1. **vra-10** — Connection indicators on post cards (show link count, makes graph tangible on the list page)
2. **vra-11** — Post neighborhood mini-graph (force-directed, depth 1-2, the signature feature)
3. **vra-12** — Related posts by graph proximity (not just tags — real graph distance)

### Content strategy
- VRA Lab needs more posts to demonstrate the graph features. More wikilinks = richer previews + better neighborhood graphs.
- Consider a "why this blog is different" post — explicit about the human-agent equality angle
- The `llms.txt` in the hero is a strong statement but needs content behind it

### Longer horizon
- vra-11 (mini-graph) is the showstopper feature — nothing else like it on a blog
- Once vra-10/11/12 land, the differentiation story is complete and ready to share

## Important context
- Site live at: https://www.vra-lab.tech (Railway, auto-deploys from release/vra-lab)
- Deploy branch: `release/vra-lab`
- Dev server: `pnpm --filter @agent-tale/vra-lab dev`
- VRA Lab only has 6 posts — `building-a-bounce.md` is the only one with wikilinks currently
- MCP server points at `examples/blog/content/posts` (not vra-lab posts)
- `vra-9-preview.html` in repo root — demo file, can be deleted after vra-9 ships to prod
- All pages use 60rem container (user preference — don't narrow)
- About page uses Georgia intentionally (book-page aesthetic) — don't change
- Vashira always reviews changes in browser before committing — never commit proactively
