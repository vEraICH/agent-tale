import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { buildGraph, slugFromPath } from '../src/graph/builder.js';

const FIXTURES_DIR = join(__dirname, '../../../fixtures/content');

describe('slugFromPath', () => {
  it('extracts slug from filename', () => {
    expect(slugFromPath('/path/to/my-post.md')).toBe('my-post');
    expect(slugFromPath('post.mdx')).toBe('post');
    expect(slugFromPath('/deep/nested/file.md')).toBe('file');
  });
});

describe('buildGraph', () => {
  it('builds a graph from fixture files', () => {
    const result = buildGraph({ contentDir: FIXTURES_DIR });

    // Should find all 5 fixture posts
    expect(result.nodes.size).toBe(5);
    expect(result.nodes.has('post-a')).toBe(true);
    expect(result.nodes.has('post-b')).toBe(true);
    expect(result.nodes.has('post-c')).toBe(true);
    expect(result.nodes.has('post-d')).toBe(true);
    expect(result.nodes.has('post-e')).toBe(true);
  });

  it('extracts correct frontmatter', () => {
    const result = buildGraph({ contentDir: FIXTURES_DIR });
    const postA = result.nodes.get('post-a')!;

    expect(postA.title).toBe('Post A');
    expect(postA.tags).toEqual(['test', 'graph']);
    expect(postA.collection).toBe('posts');
  });

  it('extracts wikilink edges', () => {
    const result = buildGraph({ contentDir: FIXTURES_DIR });

    // post-a links to post-b and post-c
    const postAEdges = result.edges.filter((e) => e.source === 'post-a');
    expect(postAEdges).toHaveLength(2);
    expect(postAEdges.map((e) => e.target).sort()).toEqual(['post-b', 'post-c']);

    // post-b links to post-a
    const postBEdges = result.edges.filter((e) => e.source === 'post-b');
    expect(postBEdges).toHaveLength(1);
    expect(postBEdges[0]!.target).toBe('post-a');

    // post-c links to post-d
    const postCEdges = result.edges.filter((e) => e.source === 'post-c');
    expect(postCEdges).toHaveLength(1);
    expect(postCEdges[0]!.target).toBe('post-d');
  });

  it('computes inDegree correctly', () => {
    const result = buildGraph({ contentDir: FIXTURES_DIR });

    // post-a: linked from post-b → inDegree 1
    expect(result.nodes.get('post-a')!.inDegree).toBe(1);
    // post-b: linked from post-a → inDegree 1
    expect(result.nodes.get('post-b')!.inDegree).toBe(1);
    // post-c: linked from post-a → inDegree 1
    expect(result.nodes.get('post-c')!.inDegree).toBe(1);
    // post-d: linked from post-c → inDegree 1
    expect(result.nodes.get('post-d')!.inDegree).toBe(1);
    // post-e: not linked from anyone → inDegree 0
    expect(result.nodes.get('post-e')!.inDegree).toBe(0);
  });

  it('computes outDegree correctly', () => {
    const result = buildGraph({ contentDir: FIXTURES_DIR });

    expect(result.nodes.get('post-a')!.outDegree).toBe(2); // links to b, c
    expect(result.nodes.get('post-b')!.outDegree).toBe(1); // links to a
    expect(result.nodes.get('post-c')!.outDegree).toBe(1); // links to d
    expect(result.nodes.get('post-d')!.outDegree).toBe(0); // no links
    expect(result.nodes.get('post-e')!.outDegree).toBe(1); // links to nonexistent
  });

  it('detects broken wikilinks', () => {
    const result = buildGraph({ contentDir: FIXTURES_DIR });
    const brokenErrors = result.errors.filter((e) => e.type === 'broken-link');

    expect(brokenErrors).toHaveLength(1);
    expect(brokenErrors[0]!.slug).toBe('post-e');
    expect(brokenErrors[0]!.message).toContain('nonexistent-post');
  });

  it('generates content hashes', () => {
    const result = buildGraph({ contentDir: FIXTURES_DIR });

    for (const [, node] of result.nodes) {
      expect(node.contentHash).toMatch(/^[a-f0-9]{16}$/);
    }
  });

  it('sets all edge types to wikilink', () => {
    const result = buildGraph({ contentDir: FIXTURES_DIR });

    for (const edge of result.edges) {
      expect(edge.linkType).toBe('wikilink');
    }
  });

  it('uses custom collection name', () => {
    const result = buildGraph({
      contentDir: FIXTURES_DIR,
      collection: 'notes',
    });

    for (const [, node] of result.nodes) {
      expect(node.collection).toBe('notes');
    }
  });
});
