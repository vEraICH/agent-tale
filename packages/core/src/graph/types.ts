export interface GraphNode {
  slug: string;
  title: string;
  description: string | null;
  collection: string;
  filePath: string;
  contentHash: string;
  date: string | null;
  tags: string[];
  agent: string | null;
  inDegree: number;
  outDegree: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  linkType: 'wikilink' | 'markdown' | 'tag' | 'unlinked_mention';
  context: string;
}

export interface Graph {
  nodes: Map<string, GraphNode>;
  edges: GraphEdge[];
  getBacklinks(slug: string): GraphNode[];
  getOutlinks(slug: string): GraphNode[];
  getRelated(slug: string, depth?: number): GraphNode[];
  getOrphans(): GraphNode[];
  getStats(): {
    nodeCount: number;
    edgeCount: number;
    orphanCount: number;
    clusters: number;
  };
}
