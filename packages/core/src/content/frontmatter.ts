/**
 * Frontmatter schema for Agent-Tale posts.
 * Validated with Zod at parse time.
 */

import { z } from 'zod';

export const PostSchema = z.object({
  title: z.string().max(200),
  description: z.string().max(500).optional(),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  draft: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  author: z.string().optional(),

  // Agent-Tale-specific
  agent: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  sources: z.array(z.string()).optional(),
  parent: z.string().optional(),

  // SEO
  canonical: z.string().url().optional(),
  ogImage: z.string().optional(),
});

export type PostFrontmatter = z.infer<typeof PostSchema>;
