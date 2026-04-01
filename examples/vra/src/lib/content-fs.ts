import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import matter from 'gray-matter';

export function contentDir(): string {
  return resolve(process.cwd(), process.env.CONTENT_DIR ?? 'content/posts');
}

export function postPath(slug: string): string {
  return join(contentDir(), `${slug}.md`);
}

export function postExists(slug: string): boolean {
  return existsSync(postPath(slug));
}

export interface PostFile {
  slug: string;
  frontmatter: Record<string, unknown>;
  content: string;
  raw: string;
}

export function readPost(slug: string): PostFile | null {
  const filePath = postPath(slug);
  if (!existsSync(filePath)) return null;
  const raw = readFileSync(filePath, 'utf-8');
  const parsed = matter(raw);
  return { slug, frontmatter: parsed.data as Record<string, unknown>, content: parsed.content.trim(), raw };
}

export function writePost(slug: string, frontmatter: Record<string, unknown>, content: string): void {
  writeFileSync(postPath(slug), matter.stringify(`\n${content}`, frontmatter), 'utf-8');
}

export function deletePost(slug: string): boolean {
  const filePath = postPath(slug);
  if (!existsSync(filePath)) return false;
  unlinkSync(filePath);
  return true;
}

export function isValidSlug(slug: unknown): slug is string {
  return typeof slug === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(slug);
}
