/**
 * Sitemap — auto-generated from the graph.
 */
import type { APIRoute } from 'astro';
import { nodes } from 'agent-tale:graph';

const SITE = 'https://example.com';

export const GET: APIRoute = () => {
  const posts = nodes.filter((n) => n.date);

  // Collect unique tags
  const tags = new Set<string>();
  for (const post of posts) {
    for (const tag of post.tags) {
      tags.add(tag);
    }
  }

  const urls = [
    // Home
    url(SITE, '1.0', 'daily'),
    // Tags index
    url(`${SITE}/tags`, '0.6', 'weekly'),
    // Individual posts
    ...posts.map((post) =>
      url(`${SITE}/posts/${post.slug}`, '0.8', 'weekly', post.date ?? undefined),
    ),
    // Tag pages
    ...Array.from(tags).map((tag) =>
      url(`${SITE}/tags/${tag}`, '0.5', 'weekly'),
    ),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};

function url(
  loc: string,
  priority: string,
  changefreq: string,
  lastmod?: string,
): string {
  return `  <url>
    <loc>${loc}</loc>
    <priority>${priority}</priority>
    <changefreq>${changefreq}</changefreq>${lastmod ? `\n    <lastmod>${new Date(lastmod).toISOString().split('T')[0]}</lastmod>` : ''}
  </url>`;
}
