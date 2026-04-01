/**
 * NewPostForm — inline form to scaffold a new post.
 * Reads admin token from sessionStorage, POSTs to /api/posts, then navigates.
 */

import { useState, useEffect } from 'react';

const TOKEN_KEY = 'agent-tale-admin-token';

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

export default function NewPostForm() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleTitleChange(v: string) {
    setTitle(v);
    if (!slugEdited) setSlug(toSlug(v));
  }

  function handleSlugChange(v: string) {
    setSlug(v);
    setSlugEdited(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const token = sessionStorage.getItem(TOKEN_KEY) ?? '';
    const today = new Date().toISOString().slice(0, 10);

    setLoading(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          slug,
          frontmatter: { title, date: today, tags: [], draft: true },
          content: '',
        }),
      });

      if (res.status === 401) { setError('Wrong token.'); return; }
      if (res.status === 409) { setError(`"${slug}" already exists.`); return; }
      if (!res.ok) { setError('Failed to create post.'); return; }

      window.location.href = `/admin/posts/${slug}`;
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={btnStyle}>
        + New Post
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <input
          autoFocus
          placeholder="Title"
          value={title}
          onChange={e => handleTitleChange(e.target.value)}
          style={inputStyle}
          required
        />
        <input
          placeholder="slug (auto-generated)"
          value={slug}
          onChange={e => handleSlugChange(e.target.value)}
          style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
          pattern="[a-z0-9][a-z0-9\-]*"
          title="Lowercase letters, numbers, hyphens"
          required
        />
      </div>
      {error && <span style={{ color: 'oklch(0.55 0.2 25)', fontSize: '0.85rem' }}>{error}</span>}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="submit" disabled={loading} style={btnStyle}>
          {loading ? 'Creating…' : 'Create'}
        </button>
        <button type="button" onClick={() => { setOpen(false); setError(''); }} style={ghostBtnStyle}>
          Cancel
        </button>
      </div>
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '0.45rem 0.75rem',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border-strong)',
  borderRadius: '6px',
  color: 'var(--color-text)',
  fontSize: '0.9rem',
  fontFamily: 'var(--font-heading)',
  outline: 'none',
  width: '20rem',
};

const btnStyle: React.CSSProperties = {
  padding: '0.45rem 1rem',
  background: 'var(--color-accent)',
  color: 'var(--color-bg)',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontFamily: 'var(--font-heading)',
  fontSize: '0.875rem',
  fontWeight: 600,
};

const ghostBtnStyle: React.CSSProperties = {
  ...btnStyle,
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  border: '1px solid var(--color-border-strong)',
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};
