// @agent-tale/core — Content Graph Engine
// The heart of Agent-Tale. Zero framework dependencies.

export { type GraphNode, type GraphEdge, type Graph } from './graph/types.js';
export {
  remarkWikilinks,
  parseWikilink,
  type WikilinkData,
  type RemarkWikilinksOptions,
} from './content/wikilinks.js';
export {
  remarkReadingTime,
  calculateReadingTime,
  type ReadingTimeOptions,
  type ReadingTimeResult,
} from './content/reading-time.js';
export { PostSchema, type PostFrontmatter } from './content/frontmatter.js';
export {
  buildGraph,
  slugFromPath,
  type BuildGraphOptions,
  type BuildGraphResult,
  type GraphBuildError,
} from './graph/builder.js';
export { createGraph } from './graph/traverse.js';
