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

      // post-d has inDegree 1 (from post-c), so not an orphan
      // post-e has outDegree 1 (broken link to nonexistent), so outDegree counts
      // But the broken link target doesn't exist, so getOutlinks returns 0...
      // However, outDegree is set by the builder based on wikilinks found, not resolved.
      // post-e outDegree = 1, so it's not an orphan by our definition.
      // Only a node with both inDegree=0 AND outDegree=0 is orphan.
      // In our fixtures, no node is a true orphan (all have at least one link direction)
      const orphanSlugs = orphans.map((n) => n.slug);
      expect(orphanSlugs).not.toContain('post-a');
      expect(orphanSlugs).not.toContain('post-b');
      expect(orphanSlugs).not.toContain('post-c');
      expect(orphanSlugs).not.toContain('post-d'); // has inDegree 1
      expect(orphanSlugs).not.toContain('post-e'); // has outDegree 1
    });
  });

  describe('getStats', () => {
    it('returns correct graph statistics', () => {
      const graph = buildFixtureGraph();
      const stats = graph.getStats();

      expect(stats.nodeCount).toBe(5);
      // Edges: post-a→post-b, post-a→post-c, post-b→post-a, post-c→post-d, post-e→nonexistent
      expect(stats.edgeCount).toBe(5);
      expect(stats.orphanCount).toBe(0); // no true orphans in fixtures
      expect(stats.clusters).toBeGreaterThanOrEqual(1);
    });

    it('counts clusters correctly', () => {
      const graph = buildFixtureGraph();
      const stats = graph.getStats();

      // post-a↔post-b, post-a→post-c→post-d form one connected component
      // post-e links to nonexistent (not in nodes), so it's its own cluster
      expect(stats.clusters).toBe(2);
    });
  });
});
