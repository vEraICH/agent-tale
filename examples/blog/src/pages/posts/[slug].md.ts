import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { getBacklinks } from 'agent-tale:graph';

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection('posts');
  return posts
    .filter((p) => !p.data.draft)
    .map((post) => ({
      params: { slug: post.id },
      props: { post },
    }));
};

export const GET: APIRoute = async ({ props }) => {
  const post = (props as any).post;
  const { title, date, description, tags, agent, confidence } = post.data;
  const backlinks = getBacklinks(post.id);

  const lines: string[] = [
    `# ${title}`,
    '',
  ];

  // Metadata block
  const meta: string[] = [];
  meta.push(`Date: ${new Date(date).toISOString().split('T')[0]}`);
  if (description) meta.push(`Description: ${description}`);
  if (tags.length > 0) meta.push(`Tags: ${tags.join(', ')}`);
  if (agent) meta.push(`Agent: ${agent}`);
  if (confidence != null) meta.push(`Confidence: ${Math.round(confidence * 100)}%`);

  lines.push(meta.join('  \n'));
  lines.push('');
  lines.push('---');
  lines.push('');

  // Raw post body
  lines.push(post.body ?? '');

  // Backlinks
  if (backlinks.length > 0) {
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Linked from');
    lines.push('');
    for (const bl of backlinks) {
      lines.push(`- [${bl.title}](/posts/${bl.slug}.md)`);
    }
  }

  lines.push('');

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
};
