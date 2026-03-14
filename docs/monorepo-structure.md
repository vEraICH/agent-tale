# Monorepo Structure

## Package Layout

```
agent-tale/
├── packages/
│   ├── core/                    # Content Graph Engine (framework-agnostic)
│   ├── astro-integration/       # Wires core into Astro build pipeline
│   ├── theme-default/           # Default blog theme (Astro components)
│   ├── admin/                   # Admin UI (React island + Astro API routes)
│   ├── mcp-server/              # MCP server for AI agent integration
│   └── create-agent-tale/        # CLI scaffolding tool
│
├── examples/                    # Example sites for testing and demos
│   ├── blog/                    # Simple blog
│   ├── digital-garden/          # Obsidian-vault-style garden
│   └── agent-journal/           # AI agent knowledge base
│
├── fixtures/                    # Shared test fixtures
│   └── content/                 # Sample .md files with known graph structure
│       ├── post-a.md            # Links to post-b, post-c
│       ├── post-b.md            # Links to post-a
│       ├── post-c.md            # Links to post-d
│       ├── post-d.md            # No links (orphan test)
│       └── post-e.md            # Broken wikilink test
│
├── docs/                        # Project documentation
├── CLAUDE.md                    # Agent context entry point
├── TASKS.md                     # Task board
├── pnpm-workspace.yaml
├── turbo.json
├── package.json                 # Root: scripts, devDeps
├── tsconfig.base.json           # Shared TS config
├── LICENSE                      # MIT
└── README.md
```

## Package Descriptions

### `@agent-tale/core`

The heart. Zero framework dependencies. Processes `.md` files and produces a graph.

```
packages/core/
├── src/
│   ├── graph/
│   │   ├── builder.ts           # Scan files → extract links → build adjacency map
│   │   ├── index.ts             # SQLite schema, CRUD, init/rebuild
│   │   ├── traverse.ts          # Backlinks, related, neighbors, orphans
│   │   └── types.ts             # GraphNode, GraphEdge, Graph interface
│   ├── content/
│   │   ├── frontmatter.ts       # Zod schemas
│   │   ├── wikilinks.ts         # Remark plugin: parse [[wikilinks]]
│   │   ├── backlinks.ts         # Remark plugin: inject backlink data
│   │   ├── reading-time.ts      # Remark plugin: compute reading time
│   │   └── unlinked-mentions.ts # Detect potential links by title match
│   ├── search/
│   │   └── indexer.ts           # Build FTS5 search index
│   └── index.ts                 # Public API exports
├── tests/
├── package.json
└── tsconfig.json
```

### `@agent-tale/astro-integration`

Astro integration. Runs graph build at build time. Provides virtual modules.

```
packages/astro-integration/
├── src/
│   ├── integration.ts           # Astro integration hooks (astro:build:*)
│   ├── vite-plugin.ts           # Vite plugin for virtual module resolution
│   └── virtual-modules.ts       # `import { graph } from 'agent-tale:graph'`
├── package.json
└── tsconfig.json
```

### `@agent-tale/theme-default`

Default theme. Astro components + Tailwind. Users can fork or override individual components.

```
packages/theme-default/
├── src/
│   ├── layouts/
│   │   ├── BaseLayout.astro     # HTML shell, <head>, SEO meta, OG tags
│   │   ├── PostLayout.astro     # Post content + backlinks panel + related posts
│   │   └── GraphLayout.astro    # Full-page graph explorer
│   ├── components/
│   │   ├── BacklinksPanel.astro
│   │   ├── GraphView.tsx        # React island, client:visible
│   │   ├── LinkPreview.astro    # Popover on wikilink hover
│   │   ├── PostCard.astro
│   │   ├── PostList.astro
│   │   ├── TableOfContents.astro
│   │   ├── SearchDialog.tsx     # React island, client:idle
│   │   ├── TagList.astro
│   │   └── ThemeToggle.astro    # Dark/light
│   ├── pages/
│   │   ├── index.astro
│   │   ├── posts/[...slug].astro
│   │   ├── graph.astro
│   │   ├── tags/[tag].astro
│   │   ├── rss.xml.ts
│   │   └── sitemap.xml.ts
│   └── styles/
│       ├── global.css           # CSS custom properties
│       └── prose.css            # Typography
├── package.json
└── tsconfig.json
```

### `@agent-tale/admin`

Admin UI. React SPA mounted as Astro island at `/admin/*`. SSR routes.

```
packages/admin/
├── src/
│   ├── pages/admin/[...path].astro  # Catch-all SSR route
│   ├── components/
│   │   ├── Editor.tsx           # CodeMirror with wikilink autocomplete
│   │   ├── FileTree.tsx
│   │   ├── GraphExplorer.tsx    # Interactive graph, orphan highlighting
│   │   ├── MediaManager.tsx
│   │   └── Dashboard.tsx
│   └── api/
│       ├── posts.ts             # CRUD endpoints
│       ├── media.ts             # Image upload
│       └── graph.ts             # Graph query
├── package.json
└── tsconfig.json
```

### `@agent-tale/mcp-server`

MCP server. Thin adapter over `@agent-tale/core`.

```
packages/mcp-server/
├── src/
│   ├── server.ts                # MCP server entry, tool registration
│   ├── tools/
│   │   ├── write-post.ts
│   │   ├── read-post.ts
│   │   ├── search.ts
│   │   ├── get-backlinks.ts
│   │   ├── get-graph.ts
│   │   ├── suggest-links.ts
│   │   ├── get-orphans.ts
│   │   └── get-recent.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

### `create-agent-tale`

CLI scaffolding. `npx create-agent-tale my-blog`.

```
packages/create-agent-tale/
├── src/
│   ├── index.ts                 # Entry point
│   ├── prompts.ts               # Interactive setup questions
│   └── templates/
│       ├── minimal/             # Bare blog
│       ├── garden/              # Digital garden with graph
│       └── agent/               # MCP-ready agent journal
├── package.json
└── tsconfig.json
```

## Workspace Configuration

### `pnpm-workspace.yaml`
```yaml
packages:
  - 'packages/*'
  - 'examples/*'
```

### `turbo.json`
```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "persistent": true,
      "cache": false
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {}
  }
}
```
