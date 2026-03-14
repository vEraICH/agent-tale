/**
 * Type declarations for the `agent-tale:graph` virtual module.
 *
 * Add to your tsconfig.json:
 *   "types": ["@agent-tale/astro-integration/virtual-modules"]
 */

declare module 'agent-tale:graph' {
  export interface GraphNodeData {
    slug: string;
    title: string;
    collection: string;
    filePath: string;
    contentHash: string;
    date: string | null;
    tags: string[];
    agent: string | null;
    inDegree: number;
    outDegree: number;
  }

  export interface GraphEdgeData {
    source: string;
    target: string;
    linkType: 'wikilink' | 'markdown' | 'tag' | 'unlinked_mention';
    context: string;
  }

  export interface GraphStats {
    nodeCount: number;
    edgeCount: number;
    orphanCount: number;
    clusters: number;
  }

  export interface GraphRef {
    slug: string;
    title: string;
  }

  export const nodes: GraphNodeData[];
  export const edges: GraphEdgeData[];
  export const stats: GraphStats;
  export const orphans: GraphRef[];

  export function getBacklinks(slug: string): GraphRef[];
  export function getRelated(slug: string): GraphRef[];
  export function getNode(slug: string): GraphNodeData | null;

  export const graph: {
    nodes: GraphNodeData[];
    edges: GraphEdgeData[];
    stats: GraphStats;
    orphans: GraphRef[];
    getBacklinks: typeof getBacklinks;
    getRelated: typeof getRelated;
    getNode: typeof getNode;
  };

  export default graph;
}
