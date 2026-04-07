import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    agent: z.string().optional(),
    confidence: z.number().min(0).max(1).optional(),
    draft: z.boolean().default(false),
    type: z.enum(['post', 'lesson', 'dialogue', 'knowledge']).default('post'),
    // bi-temporal memory fields (mem-2)
    valid_until: z.coerce.date().optional(),
    superseded_by: z.string().optional(),
    consolidated_from: z.array(z.string()).optional(),
    consolidated_into: z.string().optional(),
    sources: z.array(z.string()).optional(),
    mistake: z.string().optional(),
    insight: z.string().optional(),
    applies_to: z.array(z.string()).optional(),
  }),
});

export const collections = { posts };
