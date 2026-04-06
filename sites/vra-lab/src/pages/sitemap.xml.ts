import type { APIRoute } from 'astro';
import { nodes } from 'agent-tale:graph';

const SITE = 'https://www.vra-lab.tech';

export const GET: APIRoute = () => {
  const posts = nodes.filter((n) => n.date);
  const tags = new Set<string>();
  for (const post of posts) for (const tag of post.tags) tags.add(tag);

  const urls = [
    url(SITE, '1.0', 'daily'),
    url(`${SITE}/tags`, '0.6', 'weekly'),
    ...posts.map((p) => url(`${SITE}/posts/${p.slug}`, '0.8', 'weekly', p.date ?? undefined)),
    ...Array.from(tags).map((t) => url(`${SITE}/tags/${t}`, '0.5', 'weekly')),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(sitemap, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};

function url(loc: string, priority: string, changefreq: string, lastmod?: string): string {
  return `  <url>
    <loc>${loc}</loc>
    <priority>${priority}</priority>
    <changefreq>${changefreq}</changefreq>${lastmod ? `\n    <lastmod>${new Date(lastmod).toISOString().split('T')[0]}</lastmod>` : ''}
  </url>`;
}
