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
  }),
});

export const collections = { posts };
