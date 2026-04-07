import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';

export interface WritePostOptions {
  contentDir: string;
  onAfterWrite?: () => void;
}

export interface WritePostInput {
  slug: string;
  title: string;
  content: string;
  tags?: string[];
  draft?: boolean;
  agent?: string;
  confidence?: number;
  sources?: string[];
  type?: string;
  consolidated_from?: string[];
}

export function writePost(input: WritePostInput, opts: WritePostOptions): string {
  const {
    slug,
    title,
    content,
    tags = [],
    draft = false,
    agent,
    confidence,
    sources,
    type = 'post',
    consolidated_from,
  } = input;

  const frontmatter: Record<string, unknown> = {
    title,
    date: new Date().toISOString().split('T')[0],
    tags,
    draft,
    type,
  };
  if (agent) frontmatter.agent = agent;
  if (confidence != null) frontmatter.confidence = confidence;
  if (sources?.length) frontmatter.sources = sources;
  if (consolidated_from?.length) frontmatter.consolidated_from = consolidated_from;

  const fileContent = matter.stringify(content, frontmatter);
  const filePath = join(opts.contentDir, `${slug}.md`);

  mkdirSync(opts.contentDir, { recursive: true });
  writeFileSync(filePath, fileContent, 'utf-8');

  opts.onAfterWrite?.();

  return filePath;
}
