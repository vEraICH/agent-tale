# Testing Strategy

## Framework

- **Vitest** — fast, TypeScript-native, workspace-aware
- Run: `pnpm test` (all packages) or `pnpm --filter @agent-tale/core test`

## Test Categories

### 1. Unit Tests (`packages/core/tests/`)

Test individual functions in isolation.

**Wikilink parser:**
```
✓ parses [[slug]] → { slug: "slug", alias: null }
✓ parses [[slug|text]] → { slug: "slug", alias: "text" }
✓ parses [[collection:slug]] → { collection: "collection", slug: "slug" }
✓ parses [[slug#heading]] → { slug: "slug", anchor: "heading" }
✓ ignores escaped \[\[not-a-link\]\]
✓ handles multiple wikilinks in one paragraph
✓ handles wikilinks adjacent to punctuation
✓ ignores wikilinks inside code blocks
✓ ignores wikilinks inside inline code
```

**Graph builder:**
```
✓ builds adjacency from two linked posts
✓ handles bidirectional links (A→B and B→A)
✓ detects orphan nodes (no edges)
✓ skips draft posts
✓ extracts standard markdown links as edges
✓ handles broken links gracefully (records but flags)
✓ incremental rebuild: unchanged files skipped via content hash
```

**Backlink computation:**
```
✓ returns all nodes that link TO target
✓ includes context snippet around the link
✓ returns empty array for orphan nodes
✓ handles circular references (A→B→A)
```

**Related posts:**
```
✓ returns 2-hop neighbors
✓ weights direct links higher than 2-hop
✓ includes shared-tag bonus
✓ excludes self from results
✓ respects max limit
```

### 2. Fixture-Based Tests

Shared fixtures in `/fixtures/content/` with known graph structure:

```
fixtures/content/
├── post-a.md       # Links to: post-b, post-c
├── post-b.md       # Links to: post-a (bidirectional)
├── post-c.md       # Links to: post-d
├── post-d.md       # No links (orphan candidate — but post-c links to it)
├── post-e.md       # Broken link to [[nonexistent]]
├── post-f.md       # No links at all (true orphan)
├── draft-post.md   # draft: true
└── notes/
    └── note-a.md   # Cross-collection link to post-a via [[posts:post-a]]
```

Expected graph:
```
post-a ←→ post-b
post-a  → post-c → post-d
post-e  → [broken: nonexistent]
post-f  (orphan)
note-a  → post-a (cross-collection)
draft-post (excluded from graph)
```

**Fixture assertions:**
```
✓ graph has 7 nodes (excluding draft)
✓ graph has 5 valid edges
✓ post-a backlinks: [post-b, note-a]
✓ post-d backlinks: [post-c]
✓ post-f is an orphan
✓ post-e has 1 broken link warning
✓ draft-post is not in the graph
✓ post-a related posts include post-c (2-hop via post-b? No — direct)
✓ graph.getOrphans() returns [post-f]
```

### 3. Integration Tests (`packages/mcp-server/tests/`)

End-to-end: write via MCP → verify graph → verify content.

```
✓ write_post creates .md file with correct frontmatter
✓ write_post triggers graph rebuild
✓ read_post returns content + backlinks
✓ search finds post by title
✓ search finds post by content keyword
✓ get_backlinks returns correct nodes after write
✓ get_orphans reflects new connections
✓ suggest_links finds unlinked mentions
✓ concurrent writes don't corrupt graph
✓ file watcher detects external .md changes
```

### 4. Snapshot Tests (`packages/theme-default/tests/`)

Render posts and snapshot the HTML output.

```
✓ post with backlinks renders BacklinksPanel
✓ post without backlinks omits BacklinksPanel
✓ wikilink renders as <a> with correct href
✓ broken wikilink renders with data-broken-link attribute
✓ graph.json contains expected node/edge structure
✓ RSS feed contains all non-draft posts
✓ sitemap contains all non-draft URLs
```

### 5. Performance Tests

Not automated initially, but tracked manually:

| Scenario | Target | Command |
|---|---|---|
| Cold build, 10 posts | <1s | `time agent-tale build` |
| Cold build, 100 posts | <3s | Generate fixtures, measure |
| Cold build, 500 posts | <5s | Generate fixtures, measure |
| Hot rebuild, 1 file changed | <100ms | Modify file, measure watcher response |
| Graph query (backlinks) | <5ms | Benchmark in test |
| Graph query (2-hop related) | <10ms | Benchmark in test |

## Test Harness Design

### Graph Test Helper

```typescript
// tests/helpers/graph-helper.ts
import { buildGraph, type Graph } from '@agent-tale/core';
import { mkdtempSync, writeFileSync, cpSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export function createTestGraph(posts: Record<string, string>): Graph {
  const dir = mkdtempSync(join(tmpdir(), 'agent-tale-test-'));
  for (const [slug, content] of Object.entries(posts)) {
    writeFileSync(join(dir, `${slug}.md`), content);
  }
  return buildGraph(dir);
}

export function loadFixtureGraph(): Graph {
  const dir = mkdtempSync(join(tmpdir(), 'agent-tale-fixture-'));
  cpSync('./fixtures/content', dir, { recursive: true });
  return buildGraph(dir);
}
```

### Usage in tests

```typescript
import { describe, it, expect } from 'vitest';
import { createTestGraph } from './helpers/graph-helper';

describe('backlinks', () => {
  it('returns nodes that link to target', () => {
    const graph = createTestGraph({
      'post-a': '---\ntitle: A\ndate: 2026-01-01\n---\nSee [[post-b]]',
      'post-b': '---\ntitle: B\ndate: 2026-01-02\n---\nHello world',
    });

    const backlinks = graph.getBacklinks('post-b');
    expect(backlinks).toHaveLength(1);
    expect(backlinks[0].slug).toBe('post-a');
  });
});
```

## CI Pipeline

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm test
      - run: pnpm lint
```
