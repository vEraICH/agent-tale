# Conventions

## TypeScript

- Strict mode everywhere. `"strict": true` in tsconfig.
- No `any` types unless absolutely unavoidable (and document why).
- Use `import type` for type-only imports.
- Zod for all external data validation (frontmatter, API inputs, MCP params).
- Export types alongside implementations (co-located, not in separate `types/` dirs).
- Prefer `function` declarations over arrow functions for top-level exports.
- Use `const` arrow functions for callbacks and inline closures.

## Naming

| Thing | Convention | Example |
|---|---|---|
| Files | `kebab-case.ts` | `graph-builder.ts` |
| Astro components | `PascalCase.astro` | `BacklinksPanel.astro` |
| React components | `PascalCase.tsx` | `GraphView.tsx` |
| Functions | `camelCase` | `buildGraph()` |
| Types/Interfaces | `PascalCase` | `GraphNode` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_GRAPH_DEPTH` |
| Packages | `@agent-tale/kebab-case` | `@agent-tale/core` |
| CLI commands | `kebab-case` | `agent-tale graph --orphans` |

## File Organization

- One primary export per file when possible.
- Co-locate tests: `graph-builder.ts` → `graph-builder.test.ts` in same dir, or `tests/` subdir.
- Index files (`index.ts`) re-export public API only. No logic in index files.

## Commits

Conventional commits format:

```
feat: add wikilink parser remark plugin
fix: handle wikilinks inside code blocks
docs: add testing strategy
test: add fixture-based graph tests
chore: configure turborepo build pipeline
refactor: extract link resolution from parser
```

Scope is optional but useful:

```
feat(core): implement backlink computation
fix(theme): backlinks panel overflow on mobile
test(mcp): add write_post integration test
```

## Error Handling

- Use `Result<T, E>` pattern for operations that can fail (no thrown exceptions in core).
- Remark plugins: collect warnings (broken links), don't throw. Report at build end.
- MCP tools: return structured errors with codes, not raw strings.
- Fail fast on config/schema errors (Zod parse at startup).

## Dependencies

- `pnpm` only. No npm or yarn.
- Pin major versions in `package.json`.
- `@agent-tale/core` must have zero framework dependencies (no Astro, no React).
- Minimize dependencies. Prefer Node built-ins where reasonable.
- Every package has its own `package.json`, `tsconfig.json`, and `README.md`.

## Documentation

- Every public function has a JSDoc comment with `@param` and `@returns`.
- Every package has a `README.md` explaining what it does and how to use it.
- Complex decisions get a devlog post (see `docs/dogfooding.md`).

## CLI Commands

```bash
agent-tale dev                    # Start dev server
agent-tale build                  # Build static site + graph
agent-tale preview                # Preview production build
agent-tale graph                  # Print graph stats
agent-tale graph --orphans        # List orphaned posts
agent-tale graph --export out.json # Export graph data
agent-tale mcp                    # Start MCP server
agent-tale mcp --watch            # MCP with file watcher
agent-tale new "My Post Title"    # Create new .md with frontmatter
agent-tale check                  # Validate content (broken links, schema)
```
