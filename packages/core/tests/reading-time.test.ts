import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import {
  calculateReadingTime,
  remarkReadingTime,
  type ReadingTimeResult,
} from '../src/content/reading-time.js';

describe('calculateReadingTime', () => {
  it('returns 1 min for very short content', () => {
    const result = calculateReadingTime(10);
    expect(result).toEqual({ text: '1 min read', minutes: 1, words: 10 });
  });

  it('rounds up to next minute', () => {
    const result = calculateReadingTime(239);
    expect(result).toEqual({ text: '2 min read', minutes: 2, words: 239 });
  });

  it('calculates correctly for longer content', () => {
    const result = calculateReadingTime(1000);
    // 1000 / 238 = 4.2 → ceil → 5
    expect(result).toEqual({ text: '5 min read', minutes: 5, words: 1000 });
  });

  it('returns 1 min for zero words', () => {
    const result = calculateReadingTime(0);
    expect(result.minutes).toBe(1);
  });

  it('respects custom words per minute', () => {
    const result = calculateReadingTime(500, 250);
    expect(result).toEqual({ text: '2 min read', minutes: 2, words: 500 });
  });
});

describe('remarkReadingTime plugin', () => {
  async function processMarkdown(md: string, options?: Parameters<typeof remarkReadingTime>[0]) {
    const processor = unified().use(remarkParse).use(remarkReadingTime, options);
    const tree = processor.parse(md);
    // Create a minimal vfile-compatible object to carry data through the pipeline
    const file = { data: {} } as { data: Record<string, unknown> };
    await processor.run(tree, file as never);
    return file.data.readingTime as ReadingTimeResult;
  }

  it('computes reading time for a short post', async () => {
    const result = await processMarkdown('Hello world, this is a test.');
    expect(result.minutes).toBe(1);
    expect(result.text).toBe('1 min read');
    expect(result.words).toBeGreaterThan(0);
  });

  it('computes reading time for a longer post', async () => {
    // Generate ~500 words
    const words = Array.from({ length: 500 }, (_, i) => `word${i}`).join(' ');
    const result = await processMarkdown(words);
    expect(result.minutes).toBe(3); // 500/238 = 2.1 → ceil → 3
    expect(result.words).toBe(500);
  });

  it('ignores markdown syntax in word count', async () => {
    const md = '# Heading\n\n**Bold text** and *italic* with [links](url).';
    const result = await processMarkdown(md);
    // Should count actual words, not syntax characters
    expect(result.words).toBeGreaterThan(0);
    expect(result.minutes).toBe(1);
  });
});
