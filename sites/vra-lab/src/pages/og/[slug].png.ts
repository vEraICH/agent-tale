import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const FONT_URL = 'https://fonts.gstatic.com/s/plusjakartasans/v8/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_KU7NShXUEKi4Rw.ttf';

let fontData: ArrayBuffer | null = null;

async function getFont(): Promise<ArrayBuffer> {
  if (fontData) return fontData;
  const res = await fetch(FONT_URL);
  fontData = await res.arrayBuffer();
  return fontData;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection('posts');
  return posts
    .filter((p) => !p.data.draft)
    .map((post) => ({
      params: { slug: post.id },
      props: {
        title: post.data.title,
        date: post.data.date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        tags: post.data.tags.slice(0, 3),
      },
    }));
};

export const GET: APIRoute = async ({ props }) => {
  const { title, date, tags } = props as { title: string; date: string; tags: string[] };
  const font = await getFont();

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 64px',
          backgroundColor: '#444440',
          color: '#EAE6E0',
          fontFamily: 'Plus Jakarta Sans',
        },
        children: [
          // Top: VRA Lab branding
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '20px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                color: '#9A9A94',
              },
              children: 'VRA LAB',
            },
          },
          // Middle: Title
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                flex: 1,
                justifyContent: 'center',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: title.length > 60 ? '40px' : '48px',
                      fontWeight: 700,
                      lineHeight: 1.15,
                      letterSpacing: '-0.02em',
                      color: '#EAE6E0',
                    },
                    children: title,
                  },
                },
              ],
            },
          },
          // Bottom: date + tags
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '18px',
                color: '#9A9A94',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    children: date,
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      gap: '12px',
                    },
                    children: tags.map((tag) => ({
                      type: 'span',
                      props: {
                        style: {
                          color: '#C4836E',
                        },
                        children: `#${tag}`,
                      },
                    })),
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Plus Jakarta Sans',
          data: font,
          weight: 700,
          style: 'normal',
        },
      ],
    },
  );

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
  });

  return new Response(resvg.render().asPng(), {
    headers: { 'Content-Type': 'image/png' },
  });
};
