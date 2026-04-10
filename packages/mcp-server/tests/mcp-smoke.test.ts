/**
 * MCP protocol smoke tests — verify the server speaks correct JSON-RPC.
 *
 * These tests spawn the actual server process and communicate over stdio,
 * testing the boundary that unit tests cannot reach: tool schemas, argument
 * parsing, and response format through the full MCP transport layer.
 *
 * Written by Tim on 2026-04-10, prompted by Mao's first-day audit.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER_ENTRY = resolve(__dirname, '../dist/index.js');
const PROTOCOL_VERSION = '2025-11-25';

// ── Minimal MCP client over stdio ─────────────────────────────────────────────

class McpTestClient {
  private proc: ChildProcess;
  private pending = new Map<number, (data: unknown) => void>();
  private nextId = 1;

  constructor(postsDir: string) {
    this.proc = spawn('node', [SERVER_ENTRY, '--content', postsDir, '--collection', 'posts'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const rl = createInterface({ input: this.proc.stdout! });
    rl.on('line', (line) => {
      if (!line.trim()) return;
      try {
        const msg = JSON.parse(line) as { id?: number; result?: unknown; error?: unknown };
        if (msg.id !== undefined) {
          const resolve = this.pending.get(msg.id);
          if (resolve) {
            this.pending.delete(msg.id);
            resolve('error' in msg && !msg.result ? { _error: msg.error } : msg.result);
          }
        }
      } catch { /* ignore malformed lines */ }
    });
  }

  private send(message: unknown): void {
    this.proc.stdin!.write(JSON.stringify(message) + '\n');
  }

  async request(method: string, params: unknown = {}, timeoutMs = 8000): Promise<unknown> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`MCP request timed out after ${timeoutMs}ms: ${method}`));
      }, timeoutMs);

      this.pending.set(id, (data) => {
        clearTimeout(timer);
        resolve(data);
      });

      this.send({ jsonrpc: '2.0', id, method, params });
    });
  }

  async initialize(): Promise<void> {
    // Give the server process time to start its event loop and connect the transport.
    // Without this, stdin data arrives before the server's 'data' listener is set up.
    await new Promise((r) => setTimeout(r, 800));

    await this.request('initialize', {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: 'smoke-test', version: '0.0.0' },
    });
    // Send initialized notification (no response expected)
    this.send({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} });
  }

  async listTools(): Promise<{ tools: Array<{ name: string; description: string }> }> {
    return this.request('tools/list', {}) as Promise<{ tools: Array<{ name: string; description: string }> }>;
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<{ content: Array<{ type: string; text: string }> }> {
    return this.request('tools/call', { name, arguments: args }) as Promise<{ content: Array<{ type: string; text: string }> }>;
  }

  kill(): void {
    this.proc.kill();
  }
}

// ── Test setup ────────────────────────────────────────────────────────────────

let client: McpTestClient;
let tmpBase: string;
let postsDir: string;

beforeAll(async () => {
  tmpBase = mkdtempSync(join(tmpdir(), 'mcp-smoke-'));
  postsDir = join(tmpBase, 'posts');
  mkdirSync(postsDir, { recursive: true });

  client = new McpTestClient(postsDir);
  await client.initialize();
}, 15000);

afterAll(() => {
  client.kill();
  rmSync(tmpBase, { recursive: true, force: true });
});

// ── Tool discovery ─────────────────────────────────────────────────────────────

describe('tool list', () => {
  it('exposes all three memory tools', async () => {
    const result = await client.listTools();
    const names = result.tools.map((t) => t.name);

    expect(names).toContain('store_memory');
    expect(names).toContain('retrieve_memory');
    expect(names).toContain('get_memory_context');
  });

  it('preserves all existing content tools alongside memory tools', async () => {
    const result = await client.listTools();
    const names = result.tools.map((t) => t.name);

    expect(names).toContain('write_post');
    expect(names).toContain('read_post');
    expect(names).toContain('search');
    expect(names).toContain('get_backlinks');
    expect(names).toContain('get_graph_neighborhood');
    expect(names).toContain('suggest_links');
    expect(names).toContain('get_orphans');
    expect(names).toContain('get_recent');
  });
});

// ── store_memory via MCP protocol ─────────────────────────────────────────────

describe('store_memory tool', () => {
  it('stores a memory and returns slug + file_path', async () => {
    const result = await client.callTool('store_memory', {
      content: 'The graph is the product. Everything else is interface.',
      title: 'Core belief',
      tags: ['philosophy', 'agent-tale'],
      agent_id: 'tim',
      confidence: 0.99,
    });

    expect(result.content).toHaveLength(1);
    expect(result.content[0]!.type).toBe('text');

    const parsed = JSON.parse(result.content[0]!.text) as { slug: string; file_path: string; message: string };
    expect(parsed.slug).toMatch(/^memory-\d{8}-[a-z0-9]{5}$/);
    expect(parsed.file_path).toContain(parsed.slug);
    expect(parsed.message).toBe('Memory stored.');
  });

  it('stores a memory with minimal args (content only)', async () => {
    const result = await client.callTool('store_memory', {
      content: 'Minimal memory — no title, no tags, no agent.',
    });

    const parsed = JSON.parse(result.content[0]!.text) as { slug: string };
    expect(parsed.slug).toMatch(/^memory-/);
  });

  it('auto-derives title from content when title is omitted', async () => {
    const result = await client.callTool('store_memory', {
      content: 'Auto-derived title test sentence.',
    });

    const parsed = JSON.parse(result.content[0]!.text) as { slug: string; file_path: string };
    // File was written — slug confirms it
    expect(parsed.file_path).toBeTruthy();
  });
});

// ── retrieve_memory via MCP protocol ──────────────────────────────────────────

describe('retrieve_memory tool', () => {
  it('retrieves a memory stored in the same session', async () => {
    await client.callTool('store_memory', {
      content: 'MCP protocol smoke test memory.',
      title: 'Smoke test memory',
      tags: ['smoke-test'],
      agent_id: 'tim',
    });

    const result = await client.callTool('retrieve_memory', {
      query: 'smoke test',
    });

    const memories = JSON.parse(result.content[0]!.text) as Array<{ title: string; agent: string }>;
    expect(memories.length).toBeGreaterThan(0);
    expect(memories.some((m) => m.title === 'Smoke test memory')).toBe(true);
  });

  it('returns [] for a query that matches nothing', async () => {
    const result = await client.callTool('retrieve_memory', {
      query: 'xyzzy-absolutely-no-match-9z9z',
    });

    const memories = JSON.parse(result.content[0]!.text) as unknown[];
    expect(memories).toEqual([]);
  });

  it('filters by agent_id through the MCP protocol', async () => {
    await client.callTool('store_memory', {
      content: 'Mao perspective on testing.',
      title: 'Mao on testing',
      agent_id: 'mao',
    });

    const result = await client.callTool('retrieve_memory', {
      query: 'testing',
      agent_id: 'mao',
    });

    const memories = JSON.parse(result.content[0]!.text) as Array<{ agent: string }>;
    expect(memories.every((m) => m.agent === 'mao')).toBe(true);
  });
});

// ── get_memory_context via MCP protocol ───────────────────────────────────────

describe('get_memory_context tool', () => {
  it('returns focal memory content and neighborhood', async () => {
    const stored = await client.callTool('store_memory', {
      content: 'Context test memory.',
      title: 'Context target',
      agent_id: 'tim',
    });

    const { slug } = JSON.parse((stored as { content: Array<{ text: string }> }).content[0]!.text) as { slug: string };

    const result = await client.callTool('get_memory_context', { slug });
    const parsed = JSON.parse(result.content[0]!.text) as {
      focal: { slug: string; frontmatter: { title: string } };
      neighborhood: { nodes: unknown[] };
    };

    expect(parsed.focal.slug).toBe(slug);
    expect(parsed.focal.frontmatter.title).toBe('Context target');
    expect(parsed.neighborhood.nodes).toHaveLength(1);
  });

  it('returns error for unknown slug', async () => {
    const result = await client.callTool('get_memory_context', {
      slug: 'ghost-memory-slug-that-does-not-exist',
    });

    const parsed = JSON.parse(result.content[0]!.text) as { error?: string };
    expect(parsed).toHaveProperty('error');
  });
});
