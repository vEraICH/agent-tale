/**
 * Memory tool tests — store_memory, retrieve_memory, get_memory_context
 *
 * Written by Mao on 2026-04-10, her first day in Agent-Tale.
 * Two bugs were found during live testing and are documented here:
 *   1. PostSchema missing 'memory' type — agent/tags lost on read (FIXED)
 *   2. storeMemory uses ?? not || for title fallback — empty string title
 *      bypasses auto-derivation and produces an unretrievable memory (OPEN)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { storeMemory, retrieveMemory, getMemoryContext } from '../src/tools/memory.js';

// ── Test harness ──────────────────────────────────────────────────────────────

let memoryDir: string;

beforeEach(() => {
  memoryDir = mkdtempSync(join(tmpdir(), 'agent-tale-memory-test-'));
});

afterEach(() => {
  rmSync(memoryDir, { recursive: true, force: true });
});

// ── store_memory ──────────────────────────────────────────────────────────────

describe('storeMemory', () => {
  it('stores a memory with all fields and returns slug + file path', () => {
    const result = storeMemory(
      {
        content: 'Vashira prefers big-picture explanations before implementation detail.',
        title: 'Vashira working style',
        tags: ['vashira', 'team'],
        agent_id: 'mao',
        confidence: 0.9,
        sources: ['session-2026-04-10'],
      },
      memoryDir,
    );

    expect(result.slug).toMatch(/^memory-\d{8}-[a-z0-9]{5}$/);
    expect(result.file_path).toContain(result.slug);
  });

  it('writes a valid markdown file to the memory directory', () => {
    const result = storeMemory(
      { content: 'This is a test memory.', title: 'Test Memory', agent_id: 'mao' },
      memoryDir,
    );

    const raw = readFileSync(result.file_path, 'utf-8');
    expect(raw).toContain('title: Test Memory');
    expect(raw).toContain('agent: mao');
    expect(raw).toContain('type: memory');
    expect(raw).toContain('This is a test memory.');
  });

  it('auto-derives title from first line when title is omitted', () => {
    const result = storeMemory(
      { content: '# Graph is the product\n\nEvery node matters.' },
      memoryDir,
    );

    const raw = readFileSync(result.file_path, 'utf-8');
    expect(raw).toContain('title: Graph is the product');
  });

  it('auto-derives title from plain text first line (no heading)', () => {
    const result = storeMemory(
      { content: 'Mao joined Agent-Tale on 2026-04-10.' },
      memoryDir,
    );

    const raw = readFileSync(result.file_path, 'utf-8');
    expect(raw).toContain('title: Mao joined Agent-Tale on 2026-04-10.');
  });

  it('truncates auto-derived title at 80 characters', () => {
    const longLine = 'A'.repeat(120);
    const result = storeMemory({ content: longLine }, memoryDir);

    const raw = readFileSync(result.file_path, 'utf-8');
    const titleMatch = raw.match(/title: (.+)/);
    expect(titleMatch).not.toBeNull();
    expect(titleMatch![1]!.length).toBeLessThanOrEqual(80);
  });

  it('stores confidence as a number in frontmatter', () => {
    const result = storeMemory(
      { content: 'Uncertain observation.', confidence: 0.4 },
      memoryDir,
    );

    const raw = readFileSync(result.file_path, 'utf-8');
    expect(raw).toContain('confidence: 0.4');
  });

  it('generates unique slugs for two memories stored in rapid succession', () => {
    const a = storeMemory({ content: 'Memory A' }, memoryDir);
    const b = storeMemory({ content: 'Memory B' }, memoryDir);
    expect(a.slug).not.toBe(b.slug);
  });

  it('creates the memory directory if it does not exist', () => {
    const nestedDir = join(memoryDir, 'deep', 'nested');
    expect(() =>
      storeMemory({ content: 'Test.' }, nestedDir),
    ).not.toThrow();
  });

  /**
   * BUG (OPEN): storeMemory uses `??` not `||` for title fallback.
   * Passing title: "" stores a blank title instead of auto-deriving from content.
   * A memory stored this way is permanently unretrievable — no title, no tags
   * means no search surface. Fix: change `??` to `||` in memory.ts line ~41.
   *
   * This test documents CURRENT broken behavior.
   * When the bug is fixed, change the expectation to: toContain('title: This is the real content')
   */
  it('BUG: title: "" bypasses auto-derivation and stores a blank title', () => {
    const result = storeMemory(
      { content: 'This is the real content.' },
      memoryDir,
    );

    // Simulate what happens when an agent explicitly passes title: ""
    const bugResult = storeMemory(
      { content: 'This is the real content.', title: '' },
      memoryDir,
    );

    const raw = readFileSync(bugResult.file_path, 'utf-8');
    // Current behavior: title is blank
    expect(raw).toContain("title: ''");
    // Expected behavior (after fix): title should be 'This is the real content.'
    // expect(raw).toContain('title: This is the real content.');
  });
});

// ── retrieve_memory ───────────────────────────────────────────────────────────

describe('retrieveMemory', () => {
  it('returns [] when memory directory does not exist', () => {
    const results = retrieveMemory({ query: 'anything' }, '/nonexistent/dir/memory');
    expect(results).toEqual([]);
  });

  it('returns [] when memory directory is empty', () => {
    const results = retrieveMemory({ query: 'anything' }, memoryDir);
    expect(results).toEqual([]);
  });

  it('returns [] for a query that matches nothing', () => {
    storeMemory({ content: 'Known content.', title: 'Known' }, memoryDir);
    const results = retrieveMemory({ query: 'xyzzy-no-match' }, memoryDir);
    expect(results).toEqual([]);
  });

  it('returns [] for an empty string query', () => {
    storeMemory({ content: 'Some content.', title: 'Some' }, memoryDir);
    const results = retrieveMemory({ query: '' }, memoryDir);
    expect(results).toEqual([]);
  });

  it('finds a memory by title keyword', () => {
    storeMemory(
      { content: 'He is the only human.', title: 'Vashira profile' },
      memoryDir,
    );

    const results = retrieveMemory({ query: 'Vashira' }, memoryDir);
    expect(results).toHaveLength(1);
    expect(results[0]!.title).toBe('Vashira profile');
  });

  it('returns full memory fields: slug, title, content, confidence, agent, tags', () => {
    storeMemory(
      {
        content: 'Tim built the graph engine.',
        title: 'Tim profile',
        tags: ['tim', 'team'],
        agent_id: 'mao',
        confidence: 0.85,
      },
      memoryDir,
    );

    const results = retrieveMemory({ query: 'Tim' }, memoryDir);
    expect(results).toHaveLength(1);

    const mem = results[0]!;
    expect(mem.title).toBe('Tim profile');
    expect(mem.agent).toBe('mao');
    expect(mem.tags).toEqual(['tim', 'team']);
    expect(mem.confidence).toBe(0.85);
    expect(mem.content).toContain('Tim built the graph engine.');
  });

  it("filters by agent_id — only returns that agent's memories", () => {
    storeMemory({ content: 'Mao memory.', title: 'Mao note', agent_id: 'mao' }, memoryDir);
    storeMemory({ content: 'Tim memory.', title: 'Tim note', agent_id: 'tim' }, memoryDir);

    const results = retrieveMemory({ query: 'memory', agent_id: 'mao' }, memoryDir);
    expect(results.every((r) => r.agent === 'mao')).toBe(true);
    expect(results.some((r) => r.agent === 'tim')).toBe(false);
  });

  it('returns [] when agent_id filter matches no memories', () => {
    storeMemory({ content: 'Mao memory.', title: 'Mao note', agent_id: 'mao' }, memoryDir);

    const results = retrieveMemory({ query: 'memory', agent_id: 'unknown-agent' }, memoryDir);
    expect(results).toEqual([]);
  });

  it('respects limit parameter', () => {
    for (let i = 0; i < 10; i++) {
      storeMemory({ content: `Memory number ${i}`, title: `Memory ${i}` }, memoryDir);
    }

    const results = retrieveMemory({ query: 'Memory', limit: 3 }, memoryDir);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('includes backlinks array (empty when no other memories link to result)', () => {
    storeMemory({ content: 'Isolated memory.', title: 'Isolated' }, memoryDir);
    const results = retrieveMemory({ query: 'Isolated' }, memoryDir);
    expect(results[0]!.backlinks).toEqual([]);
  });

  it('includes backlinks when another memory links to the result', () => {
    const a = storeMemory({ content: 'Memory A.', title: 'Memory A' }, memoryDir);
    storeMemory(
      { content: `Memory B links to [[${a.slug}]].`, title: 'Memory B' },
      memoryDir,
    );

    const results = retrieveMemory({ query: 'Memory A' }, memoryDir);
    expect(results[0]!.backlinks).toHaveLength(1);
    expect(results[0]!.backlinks[0]!.title).toBe('Memory B');
  });

  /**
   * KNOWN GAP: When agent_id filter is applied, search runs at limit*3 first,
   * then filters by agent_id, then slices to limit. If an agent's memories rank
   * low in search results, fewer than `limit` results are returned even when
   * more exist. This is a silent pagination gap, not a crash.
   */
  it('GAP: agent_id filter may return fewer results than limit when agent memories rank low', () => {
    // Store 20 memories for agent 'tim', then 1 for 'mao' that ranks highly
    for (let i = 0; i < 20; i++) {
      storeMemory({ content: `Tim detail ${i}`, title: `Tim ${i}`, agent_id: 'tim' }, memoryDir);
    }
    storeMemory({ content: 'Mao note about details', title: 'Mao detail', agent_id: 'mao' }, memoryDir);

    // Requesting 5 tim memories — search at limit*3=15, all 15 may be tim's
    const results = retrieveMemory({ query: 'detail', agent_id: 'tim', limit: 5 }, memoryDir);

    // This passes currently — but if mao's memory ranked in the top 15
    // and pushed tim memories out, this would silently return < 5
    expect(results.length).toBeLessThanOrEqual(5);
  });
});

// ── get_memory_context ────────────────────────────────────────────────────────

describe('getMemoryContext', () => {
  it('returns error when memory directory does not exist', () => {
    const result = getMemoryContext({ slug: 'any' }, '/nonexistent/dir/memory');
    expect(result).toHaveProperty('error');
    expect((result as { error: string }).error).toContain('No memories stored yet.');
  });

  it('returns error when slug does not exist in memory graph', () => {
    storeMemory({ content: 'Something.', title: 'Something' }, memoryDir);
    const result = getMemoryContext({ slug: 'ghost-slug' }, memoryDir);
    expect(result).toHaveProperty('error');
  });

  it('returns focal memory with frontmatter and content', () => {
    const stored = storeMemory(
      { content: 'The graph is the product.', title: 'Core belief', agent_id: 'mao' },
      memoryDir,
    );

    const result = getMemoryContext({ slug: stored.slug }, memoryDir) as {
      focal: { slug: string; frontmatter: Record<string, unknown>; content: string };
      neighborhood: unknown;
    };

    expect(result.focal.slug).toBe(stored.slug);
    expect(result.focal.frontmatter.title).toBe('Core belief');
    expect(result.focal.frontmatter.agent).toBe('mao');
    expect(result.focal.content).toContain('The graph is the product.');
  });

  it('returns neighborhood with only the focal node when memory has no wikilinks', () => {
    const stored = storeMemory(
      { content: 'No links here.', title: 'Isolated' },
      memoryDir,
    );

    const result = getMemoryContext({ slug: stored.slug }, memoryDir) as {
      focal: unknown;
      neighborhood: { nodes: unknown[]; edges: unknown[] };
    };

    expect(result.neighborhood.nodes).toHaveLength(1);
    expect(result.neighborhood.edges).toHaveLength([].length); // empty
  });

  it('returns edges when two memories wikilink to each other', () => {
    const a = storeMemory({ content: 'Memory A.', title: 'A' }, memoryDir);
    const b = storeMemory(
      { content: `Memory B links to [[${a.slug}]].`, title: 'B' },
      memoryDir,
    );

    const result = getMemoryContext({ slug: b.slug, depth: 1 }, memoryDir) as {
      focal: unknown;
      neighborhood: { nodes: unknown[]; edges: Array<{ source: string; target: string }> };
    };

    expect(result.neighborhood.edges).toHaveLength(1);
    expect(result.neighborhood.edges[0]!.source).toBe(b.slug);
    expect(result.neighborhood.edges[0]!.target).toBe(a.slug);
  });

  it('respects depth parameter — depth 1 returns only immediate neighbors', () => {
    const a = storeMemory({ content: 'A.', title: 'A' }, memoryDir);
    const b = storeMemory(
      { content: `B links to [[${a.slug}]].`, title: 'B' },
      memoryDir,
    );
    const c = storeMemory(
      { content: `C links to [[${b.slug}]].`, title: 'C' },
      memoryDir,
    );

    const result = getMemoryContext({ slug: c.slug, depth: 1 }, memoryDir) as {
      neighborhood: { nodes: Array<{ slug: string }> };
    };

    const slugsInNeighborhood = result.neighborhood.nodes.map((n) => n.slug);
    expect(slugsInNeighborhood).toContain(c.slug);
    expect(slugsInNeighborhood).toContain(b.slug);
    // 'a' is 2 hops away — should not appear at depth 1
    expect(slugsInNeighborhood).not.toContain(a.slug);
  });

  /**
   * KNOWN GAP: Cross-graph wikilinks are counted in outDegree but absent from
   * the neighborhood edges. A memory that links to a post slug (e.g. [[devlog-2026-04-10]])
   * will show outDegree > 0 but edges: [] — the link is silently invisible.
   * An agent navigating the neighborhood cannot discover the connection.
   */
  it('GAP: wikilink to a post slug is counted in outDegree but absent from neighborhood edges', () => {
    const mem = storeMemory(
      {
        content: 'This memory references [[devlog-mao-arrival]] from the posts graph.',
        title: 'Cross-graph reference',
      },
      memoryDir,
    );

    const result = getMemoryContext({ slug: mem.slug, depth: 2 }, memoryDir) as {
      neighborhood: { nodes: Array<{ slug: string; outDegree: number }>; edges: unknown[] };
    };

    const focalNode = result.neighborhood.nodes.find((n) => n.slug === mem.slug)!;
    // The wikilink is counted...
    expect(focalNode.outDegree).toBe(1);
    // ...but the edge does not appear because the target is not in the memory graph
    expect(result.neighborhood.edges).toHaveLength(0);
  });
});

// ── round-trip ────────────────────────────────────────────────────────────────

describe('store → retrieve round-trip', () => {
  it('stores and retrieves a memory with agent_id intact', () => {
    storeMemory(
      { content: 'Agent filter test.', title: 'Filter test', agent_id: 'mao' },
      memoryDir,
    );

    const results = retrieveMemory({ query: 'Filter test', agent_id: 'mao' }, memoryDir);
    expect(results).toHaveLength(1);
    expect(results[0]!.agent).toBe('mao');
  });

  it('stores and retrieves a memory with tags intact', () => {
    storeMemory(
      { content: 'Tag test.', title: 'Tag test', tags: ['alpha', 'beta'] },
      memoryDir,
    );

    const results = retrieveMemory({ query: 'Tag test' }, memoryDir);
    expect(results[0]!.tags).toEqual(['alpha', 'beta']);
  });

  it('stored slug from storeMemory works directly in getMemoryContext', () => {
    const stored = storeMemory(
      { content: 'Round-trip test.', title: 'Round-trip' },
      memoryDir,
    );

    const context = getMemoryContext({ slug: stored.slug }, memoryDir);
    expect(context).not.toHaveProperty('error');
  });

  it('memories from different agents do not cross-contaminate retrieval', () => {
    storeMemory({ content: 'Only for mao.', title: 'Mao only', agent_id: 'mao' }, memoryDir);
    storeMemory({ content: 'Only for tim.', title: 'Tim only', agent_id: 'tim' }, memoryDir);

    const maoResults = retrieveMemory({ query: 'only', agent_id: 'mao' }, memoryDir);
    const timResults = retrieveMemory({ query: 'only', agent_id: 'tim' }, memoryDir);

    expect(maoResults.every((r) => r.agent === 'mao')).toBe(true);
    expect(timResults.every((r) => r.agent === 'tim')).toBe(true);
  });
});

// ── isolation: memory vs posts ────────────────────────────────────────────────

describe('memory graph isolation', () => {
  /**
   * The memory graph and the posts graph are completely separate.
   * Both are built by buildGraph() but from different directories.
   * Tests here verify that the boundary holds at the function level.
   */

  it('buildMemoryGraph only includes files from the memory directory', () => {
    // Store a memory
    storeMemory({ content: 'Some content.', title: 'Memory-only item' }, memoryDir);

    // Retrieve from memory dir — should find it
    const memResults = retrieveMemory({ query: 'Memory-only' }, memoryDir);
    expect(memResults).toHaveLength(1);

    // Retrieve from a different dir (simulating posts dir) — should find nothing
    const otherDir = mkdtempSync(join(tmpdir(), 'agent-tale-posts-'));
    try {
      const postResults = retrieveMemory({ query: 'Memory-only' }, otherDir);
      expect(postResults).toEqual([]);
    } finally {
      rmSync(otherDir, { recursive: true, force: true });
    }
  });

  it('getMemoryContext on a memory slug returns error when called against wrong dir', () => {
    const stored = storeMemory(
      { content: 'Stored in memory dir.', title: 'Memory item' },
      memoryDir,
    );

    // Calling with a different (empty) dir — slug not found there
    const wrongDir = mkdtempSync(join(tmpdir(), 'agent-tale-wrong-'));
    try {
      const result = getMemoryContext({ slug: stored.slug }, wrongDir);
      expect(result).toHaveProperty('error');
    } finally {
      rmSync(wrongDir, { recursive: true, force: true });
    }
  });
});
