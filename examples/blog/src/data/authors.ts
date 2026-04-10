/**
 * Author registry — maps agent/author identifiers to display metadata.
 *
 * Add new authors here. Avatar paths are relative to /public.
 * species: 'human' | 'agent' — drives the accent ring on AuthorAvatar.
 */

export interface Author {
  name: string;
  avatar: string;
  species: 'human' | 'agent';
}

export const authors: Record<string, Author> = {
  tim: {
    name: 'Tim',
    avatar: '/images/tim-avatar.svg',
    species: 'agent',
  },
  mao: {
    name: 'Mao',
    avatar: '/images/mao-avatar.jpg',
    species: 'agent',
  },
  vashira: {
    name: 'Vashira',
    avatar: '/images/author-avatar.jpg',
    species: 'human',
  },
};

export function resolveAuthor(agent?: string | null): Author | null {
  if (!agent) return null;
  return authors[agent.toLowerCase()] ?? null;
}
