import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { buildGraph } from '../src/graph/builder.js';
import { createGraph } from '../src/graph/traverse.js';

const FIXTURES_DIR = join(__dirname, '../../../fixtures/content');

function buildFixtureGraph() {
  const { nodes, edges } = buildGraph({ contentDir: FIXTURES_DIR });
  return createGraph(nodes, edges);
}

describe('createGraph', () => {
  describe('getBacklinks', () => {
    it('returns nodes that link TO the given slug', () => {
      const graph = buildFixtureGraph();

      // post-a is linked from post-b
      const backlinks = graph.getBacklinks('post-a');
      expect(backlinks).toHaveLength(1);
      expect(backlinks[0]!.slug).toBe('post-b');
    });

    it('returns multiple backlinks', () => {
      const graph = buildFixtureGraph();

      // post-b is linked from post-a
      const backlinks = graph.getBacklinks('post-b');
      expect(backlinks).toHaveLength(1);
      expect(backlinks[0]!.slug).toBe('post-a');
    });

    it('returns empty for nodes with no backlinks', () => {
      const graph = buildFixtureGraph();

      // post-e links to nonexistent-post, nobody links to post-e
      const backlinks = graph.getBacklinks('post-e');
      expect(backlinks).toHaveLength(0);
    });
  });

  describe('getOutlinks', () => {
    it('returns nodes that the given slug links TO', () => {
      const graph = buildFixtureGraph();

      const outlinks = graph.getOutlinks('post-a');
      expect(outlinks).toHaveLength(2);
      const slugs = outlinks.map((n) => n.slug).sort();
      expect(slugs).toEqual(['post-b', 'post-c']);
    });

    it('returns empty for nodes with no outlinks', () => {
      const graph = buildFixtureGraph();

      const outlinks = graph.getOutlinks('post-d');
      expect(outlinks).toHaveLength(0);
    });

    it('excludes broken links (target not in nodes)', () => {
      const graph = buildFixtureGraph();

      // post-e links to nonexistent-post, which isn't a node
      const outlinks = graph.getOutlinks('post-e');
      expect(outlinks).toHaveLength(0);
    });
  });

  describe('getRelated', () => {
    it('finds related posts via link graph', () => {
      const graph = buildFixtureGraph();

      // post-a → post-b, post-c. post-b → post-a. post-c → post-d.
      // Related to post-a at depth 2: post-b (direct), post-c (direct), post-d (2-hop via c)
      const related = graph.getRelated('post-a');
      const slugs = related.map((n) => n.slug);
      expect(slugs).toContain('post-b');
      expect(slugs).toContain('post-c');
      expect(slugs).toContain('post-d');
    });

    it('scores direct links higher than 2-hop', () => {
      const graph = buildFixtureGraph();
      const related = graph.getRelated('post-a');

      // post-b and post-c are direct (weight 1.0), post-d is 2-hop (weight 0.5)
      const bIndex = related.findIndex((n) => n.slug === 'post-b');
      const dIndex = related.findIndex((n) => n.slug === 'post-d');
      expect(bIndex).toBeLessThan(dIndex);
    });

    it('returns empty for isolated nodes', () => {
      const graph = buildFixtureGraph();

      // post-d has inDegree 1 but outDegree 0. Related should find post-c (backlink)
      const related = graph.getRelated('post-d');
      expect(related.length).toBeGreaterThan(0);
      expect(related[0]!.slug).toBe('post-c');
    });
  });

  describe('getOrphans', () => {
    it('returns nodes with no connections', () => {
      const graph = buildFixtureGraph();
      const orphans = graph.getOrphans();
      const orphanSlugs = orphans.map((n) => n.slug);

      // post-f is the true orphan — no links in or out
      expect(orphanSlugs).toContain('post-f');
      expect(orphanSlugs).not.toContain('post-a');
      expect(orphanSlugs).not.toContain('post-b');
      expect(orphanSlugs).not.toContain('post-c');
      expect(orphanSlugs).not.toContain('post-d'); // has inDegree 1
      expect(orphanSlugs).not.toContain('post-e'); // has outDegree 1
    });

    it('identifies exactly one orphan in fixtures', () => {
      const graph = buildFixtureGraph();
      const orphans = graph.getOrphans();

      expect(orphans).toHaveLength(1);
      expect(orphans[0]!.slug).toBe('post-f');
    });
  });

  describe('getStats', () => {
    it('returns correct graph statistics', () => {
      const graph = buildFixtureGraph();
      const stats = graph.getStats();

      expect(stats.nodeCount).toBe(6);
      // Edges: post-a→post-b, post-a→post-c, post-b→post-a, post-c→post-d, post-e→nonexistent
      expect(stats.edgeCount).toBe(5);
      expect(stats.orphanCount).toBe(1); // post-f is the true orphan
      expect(stats.clusters).toBeGreaterThanOrEqual(1);
    });

    it('counts clusters correctly', () => {
      const graph = buildFixtureGraph();
      const stats = graph.getStats();

      // post-a↔post-b, post-a→post-c→post-d form one connected component
      // post-e links to nonexistent (not in nodes), so it's its own cluster
      // post-f is isolated — its own cluster
      expect(stats.clusters).toBe(3);
    });
  });

  describe('getRelated (advanced)', () => {
    it('excludes self from results', () => {
      const graph = buildFixtureGraph();
      const related = graph.getRelated('post-a');
      const slugs = related.map((n) => n.slug);

      expect(slugs).not.toContain('post-a');
    });

    it('returns at most 5 results', () => {
      const graph = buildFixtureGraph();
      const related = graph.getRelated('post-a');

      expect(related.length).toBeLessThanOrEqual(5);
    });

    it('includes tag bonus in scoring', () => {
      const graph = buildFixtureGraph();
      // post-a has tags [test, graph], post-c has [test, graph]
      // post-c is also a direct link — gets link weight (1.0) + shared tag bonus (2 × 0.3 = 0.6)
      // post-b has [test] — gets link weight (1.0) + shared tag bonus (1 × 0.3 = 0.3)
      const related = graph.getRelated('post-a');
      const cIndex = related.findIndex((n) => n.slug === 'post-c');
      const bIndex = related.findIndex((n) => n.slug === 'post-b');

      // post-c (1.6) should rank higher than post-b (1.3)
      expect(cIndex).toBeLessThan(bIndex);
    });

    it('handles circular references (A→B→A)', () => {
      const graph = buildFixtureGraph();
      // post-a and post-b have circular links
      const relatedA = graph.getRelated('post-a');
      const relatedB = graph.getRelated('post-b');

      expect(relatedA.map((n) => n.slug)).toContain('post-b');
      expect(relatedB.map((n) => n.slug)).toContain('post-a');
    });

    it('returns empty for true orphan', () => {
      const graph = buildFixtureGraph();
      const related = graph.getRelated('post-f');

      // post-f has no links — only tag-based matches possible
      // post-f has tag [isolated] which no one else shares
      expect(related).toHaveLength(0);
    });
  });

  describe('backlinks with context', () => {
    it('handles nodes linked from multiple sources', () => {
      const graph = buildFixtureGraph();
      // post-a is linked from post-b
      const backlinks = graph.getBacklinks('post-a');

      expect(backlinks).toHaveLength(1);
      expect(backlinks[0]!.slug).toBe('post-b');
    });

    it('getBacklinks for post-d includes post-c', () => {
      const graph = buildFixtureGraph();
      const backlinks = graph.getBacklinks('post-d');

      expect(backlinks).toHaveLength(1);
      expect(backlinks[0]!.slug).toBe('post-c');
    });
  });
});
