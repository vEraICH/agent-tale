/**
 * Remark plugin: compute reading time from markdown content.
 *
 * Injects `minutesRead` into the file's data (accessible via frontmatter).
 * Average reading speed: 238 words per minute (research-backed).
 */

import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import { toString } from 'mdast-util-to-string';

export interface ReadingTimeOptions {
  /** Words per minute. Defaults to 238. */
  wordsPerMinute?: number;
}

export interface ReadingTimeResult {
  /** Human-readable string, e.g. "3 min read" */
  text: string;
  /** Raw minutes (rounded up, minimum 1) */
  minutes: number;
  /** Raw word count */
  words: number;
}

/** Calculate reading time from a word count. */
export function calculateReadingTime(
  wordCount: number,
  wordsPerMinute = 238,
): ReadingTimeResult {
  const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  return {
    text: `${minutes} min read`,
    minutes,
    words: wordCount,
  };
}

/**
 * Remark plugin that computes reading time and attaches it to file data.
 *
 * Access via `file.data.readingTime` after processing.
 */
export const remarkReadingTime: Plugin<[ReadingTimeOptions?], Root> =
  function (options = {}) {
    const { wordsPerMinute = 238 } = options;

    return (tree: Root, file) => {
      const text = toString(tree);
      const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;
      const result = calculateReadingTime(wordCount, wordsPerMinute);

      file.data.readingTime = result;
    };
  };
