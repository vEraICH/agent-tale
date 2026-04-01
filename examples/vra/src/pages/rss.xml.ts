import type { APIRoute } from 'astro';
import { nodes } from 'agent-tale:graph';

const SITE = 'https://vra.example.com';
const TITLE = 'VRA';
const DESCRIPTION = 'A personal knowledge graph. Every post is a node, every link is a connection.';

export const GET: APIRoute = () => {
  const posts = nodes
    .filter((n) => n.date)
    .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());

  const items = posts.map((post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE}/posts/${post.slug}</link>
      <guid>${SITE}/posts/${post.slug}</guid>
      <pubDate>${new Date(post.date!).toUTCString()}</pubDate>
      ${post.tags.map((t) => `<category>${escapeXml(t)}</category>`).join('\n      ')}
    </item>`).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(TITLE)}</title>
    <description>${escapeXml(DESCRIPTION)}</description>
    <link>${SITE}</link>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(rss, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
