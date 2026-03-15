import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import {
  parseWikilink,
  remarkWikilinks,
  type WikilinkData,
} from '../src/content/wikilinks.js';

// --- Unit tests for parseWikilink ---

describe('parseWikilink', () => {
  it('parses basic slug', () => {
    const result = parseWikilink('[[my-post]]', 'my-post');
    expect(result).toEqual({
      raw: '[[my-post]]',
      slug: 'my-post',
      displayText: 'my-post',
      collection: null,
      heading: null,
    });
  });

  it('parses slug with display text', () => {
    const result = parseWikilink('[[my-post|Click here]]', 'my-post|Click here');
    expect(result).toEqual({
      raw: '[[my-post|Click here]]',
      slug: 'my-post',
      displayText: 'Click here',
      collection: null,
      heading: null,
    });
  });

  it('parses collection:slug', () => {
    const result = parseWikilink('[[posts:my-post]]', 'posts:my-post');
    expect(result).toEqual({
      raw: '[[posts:my-post]]',
      slug: 'my-post',
      displayText: 'my-post',
      collection: 'posts',
      heading: null,
    });
  });

  it('parses slug#heading', () => {
    const result = parseWikilink('[[my-post#intro]]', 'my-post#intro');
    expect(result).toEqual({
      raw: '[[my-post#intro]]',
      slug: 'my-post',
      displayText: 'my-post',
      collection: null,
      heading: 'intro',
    });
  });

  it('parses the full combo: collection:slug#heading|text', () => {
    const result = parseWikilink(
      '[[docs:api-ref#auth|Auth Docs]]',
      'docs:api-ref#auth|Auth Docs',
    );
    expect(result).toEqual({
      raw: '[[docs:api-ref#auth|Auth Docs]]',
      slug: 'api-ref',
      displayText: 'Auth Docs',
      collection: 'docs',
      heading: 'auth',
    });
  });

  it('trims whitespace in parts', () => {
    const result = parseWikilink('[[  my-post | nice text  ]]', '  my-post | nice text  ');
    expect(result).toEqual({
      raw: '[[  my-post | nice text  ]]',
      slug: 'my-post',
      displayText: 'nice text',
      collection: null,
      heading: null,
    });
  });
});

// --- Integration tests for remarkWikilinks plugin ---

async function processMarkdown(
  md: string,
  options: Parameters<typeof remarkWikilinks>[0] = {},
) {
  const processor = unified().use(remarkParse).use(remarkWikilinks, options);
  return processor.run(processor.parse(md));
}

function findLinks(tree: ReturnType<typeof JSON.parse>): Array<{
  url: string;
  text: string;
  broken: boolean;
}> {
  const links: Array<{ url: string; text: string; broken: boolean }> = [];

  function walk(node: { type: string; url?: string; children?: Array<{ type: string; value?: string }>; data?: { hProperties?: { 'data-broken-link'?: boolean } } }) {
    if (node.type === 'link' && node.data?.hProperties) {
      links.push({
        url: node.url ?? '',
        text: node.children?.[0]?.type === 'text' ? node.children[0].value ?? '' : '',
        broken: !!node.data.hProperties['data-broken-link'],
      });
    }
    if ('children' in node && Array.isArray(node.children)) {
      for (const child of node.children) {
        walk(child as typeof node);
      }
    }
  }

  walk(tree);
  return links;
}

describe('remarkWikilinks plugin', () => {
  it('transforms [[slug]] into a link node', async () => {
    const tree = await processMarkdown('Check out [[my-post]] for details.');
    const links = findLinks(tree);

    expect(links).toHaveLength(1);
    expect(links[0]).toEqual({
      url: '/posts/my-post',
      text: 'my-post',
      broken: false,
    });
  });

  it('transforms [[slug|text]] with display text', async () => {
    const tree = await processMarkdown('Read [[my-post|this article]] now.');
    const links = findLinks(tree);

    expect(links).toHaveLength(1);
    expect(links[0]).toEqual({
      url: '/posts/my-post',
      text: 'this article',
      broken: false,
    });
  });

  it('transforms [[collection:slug]]', async () => {
    const tree = await processMarkdown('See [[docs:api-ref]] for API details.');
    const links = findLinks(tree);

    expect(links).toHaveLength(1);
    expect(links[0]).toEqual({
      url: '/docs/api-ref',
      text: 'api-ref',
      broken: false,
    });
  });

  it('transforms [[slug#heading]]', async () => {
    const tree = await processMarkdown('Jump to [[my-post#setup]].');
    const links = findLinks(tree);

    expect(links).toHaveLength(1);
    expect(links[0]).toEqual({
      url: '/posts/my-post#setup',
      text: 'my-post',
      broken: false,
    });
  });

  it('handles multiple wikilinks in one paragraph', async () => {
    const tree = await processMarkdown(
      'Link to [[post-a]] and also [[post-b|Post B]] here.',
    );
    const links = findLinks(tree);

    expect(links).toHaveLength(2);
    expect(links[0]!.url).toBe('/posts/post-a');
    expect(links[1]!.url).toBe('/posts/post-b');
    expect(links[1]!.text).toBe('Post B');
  });

  it('marks broken links when slugToPath is provided', async () => {
    const slugToPath = new Map([['post-a', '/posts/post-a']]);
    const tree = await processMarkdown(
      'Known [[post-a]] and unknown [[post-z]].',
      { slugToPath },
    );
    const links = findLinks(tree);

    expect(links).toHaveLength(2);
    expect(links[0]).toEqual({ url: '/posts/post-a', text: 'post-a', broken: false });
    expect(links[1]).toEqual({ url: '/posts/post-z', text: 'post-z', broken: true });
  });

  it('calls onWikilink callback for each wikilink', async () => {
    const collected: WikilinkData[] = [];
    await processMarkdown('See [[alpha]] and [[beta|B]]', {
      onWikilink: (data) => collected.push(data),
    });

    expect(collected).toHaveLength(2);
    expect(collected[0]!.slug).toBe('alpha');
    expect(collected[1]!.slug).toBe('beta');
    expect(collected[1]!.displayText).toBe('B');
  });

  it('ignores transclusion syntax ![[slug]]', async () => {
    const tree = await processMarkdown('Embed ![[embedded]] but link [[linked]].');
    const links = findLinks(tree);

    expect(links).toHaveLength(1);
    expect(links[0]!.url).toBe('/posts/linked');
  });

  it('resolves from slugToPath map when available', async () => {
    const slugToPath = new Map([
      ['my-post', '/blog/2026/my-post'],
    ]);
    const tree = await processMarkdown('See [[my-post]].', { slugToPath });
    const links = findLinks(tree);

    expect(links).toHaveLength(1);
    expect(links[0]!.url).toBe('/blog/2026/my-post');
  });

  it('leaves plain text unchanged when no wikilinks present', async () => {
    const tree = await processMarkdown('Just a normal paragraph with [regular](link).');
    const links = findLinks(tree);

    expect(links).toHaveLength(0);
  });

  it('ignores wikilinks inside fenced code blocks', async () => {
    const md = 'Before\n\n```\n[[not-a-link]]\n```\n\nAfter [[real-link]].';
    const tree = await processMarkdown(md);
    const links = findLinks(tree);

    expect(links).toHaveLength(1);
    expect(links[0]!.url).toBe('/posts/real-link');
  });

  it('ignores wikilinks inside inline code', async () => {
    const md = 'Use `[[not-a-link]]` syntax to link. See [[real-link]].';
    const tree = await processMarkdown(md);
    const links = findLinks(tree);

    expect(links).toHaveLength(1);
    expect(links[0]!.url).toBe('/posts/real-link');
  });

  it('handles wikilinks adjacent to punctuation', async () => {
    const md = 'See [[post-a]], [[post-b]]. Also ([[post-c]]) and [[post-d]]!';
    const tree = await processMarkdown(md);
    const links = findLinks(tree);

    expect(links).toHaveLength(4);
    expect(links.map((l) => l.url)).toEqual([
      '/posts/post-a',
      '/posts/post-b',
      '/posts/post-c',
      '/posts/post-d',
    ]);
  });

  it('handles wikilinks at start and end of text', async () => {
    const md = '[[start-link]] middle text [[end-link]]';
    const tree = await processMarkdown(md);
    const links = findLinks(tree);

    expect(links).toHaveLength(2);
    expect(links[0]!.url).toBe('/posts/start-link');
    expect(links[1]!.url).toBe('/posts/end-link');
  });

  it('handles empty wikilink gracefully', async () => {
    const md = 'Empty [[]] should not crash. Real [[post-a]] works.';
    const tree = await processMarkdown(md);
    const links = findLinks(tree);

    // [[]] may or may not parse — just verify no crash and real link works
    const realLinks = links.filter((l) => l.url === '/posts/post-a');
    expect(realLinks).toHaveLength(1);
  });
});
