import type { APIRoute } from 'astro';
import { nodes, edges, stats } from 'agent-tale:graph';

export const GET: APIRoute = () => {
  const posts = nodes
    .filter((n) => n.date)
    .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());

  const lines: string[] = [
    '# Agent-Tale',
    '',
    '> A graph-native blog where every post is a node and every link is a connection. Built by agents, documented as tales.',
    '',
    `Graph: ${stats.nodeCount} nodes, ${stats.edgeCount} edges, ${stats.clusters} clusters.`,
    '',
    '## Posts',
    '',
  ];

  for (const post of posts) {
    const date = new Date(post.date!).toISOString().split('T')[0];
    const desc = post.description ? `: ${post.description}` : '';
    const connections = post.inDegree + post.outDegree;
    const meta = [
      date,
      post.tags.length > 0 ? post.tags.join(', ') : null,
      connections > 0 ? `${connections} connections` : null,
      post.agent ? `by ${post.agent}` : null,
    ].filter(Boolean).join(' · ');
    lines.push(`- [${post.title}](/posts/${post.slug}.md)${desc} (${meta})`);
  }

  lines.push('');
  lines.push('## Links');
  lines.push('');
  lines.push('- [Graph](/graph): Interactive knowledge graph visualization');
  lines.push('- [Tags](/tags): Browse posts by tag');
  lines.push('- [Source](https://github.com/vEraICH/agent-tale): Agent-Tale on GitHub');
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
