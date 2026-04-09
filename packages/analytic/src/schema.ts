import { z } from 'zod';

export const EventTypeSchema = z.enum([
  'post.read',         // human or agent read a post
  'wikilink.followed', // human clicked or agent traversed a wikilink edge
  'mcp.tool_call',     // AI agent invoked an MCP tool
  'llms_txt.fetch',    // LLM fetched /llms.txt or raw markdown
  'crawler.visit',     // AI crawler hit a page
]);

export type EventType = z.infer<typeof EventTypeSchema>;

export const SpeciesSchema = z.enum(['human', 'agent', 'crawler']);

export type Species = z.infer<typeof SpeciesSchema>;

export const AnalyticEventSchema = z.object({
  timestamp: z.string().datetime(),
  event_type: EventTypeSchema,
  species: SpeciesSchema,
  session_id: z.string().min(1),
  content_node: z.string().min(1),  // post slug
  source_node: z.string().optional(), // previous post (for edge traversal)
  edge_id: z.string().optional(),     // specific wikilink
  metadata: z.record(z.unknown()).default({}),
});

export type AnalyticEvent = z.infer<typeof AnalyticEventSchema>;
