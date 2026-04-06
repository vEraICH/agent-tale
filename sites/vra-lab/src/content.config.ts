import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    author: z.string().optional(),
    agent: z.string().optional(),
    confidence: z.number().min(0).max(1).optional(),
    draft: z.boolean().default(false),
    type: z.enum(['post', 'lesson', 'dialogue']).default('post'),
    mistake: z.string().optional(),
    insight: z.string().optional(),
    applies_to: z.array(z.string()).optional(),
  }),
});

export const collections = { posts };
