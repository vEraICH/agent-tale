/**
 * PostEditor — CodeMirror markdown editor with frontmatter form.
 *
 * Features:
 *   - Markdown editing via CodeMirror 6 (lang-markdown)
 *   - [[wikilink]] autocomplete from the graph nodes list
 *   - Structured frontmatter sidebar (title, desc, date, tags, draft)
 *   - Saves via PUT /api/posts/:slug, Bearer token from sessionStorage
 *   - Ctrl/Cmd+S keyboard shortcut
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { basicSetup } from 'codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { autocompletion, type CompletionContext } from '@codemirror/autocomplete';

const TOKEN_KEY = 'agent-tale-admin-token';

interface NodeRef { slug: string; title: string; }

interface Props {
  slug: string;
  frontmatter: Record<string, unknown>;
  content: string;
  inDegree: number;
  outDegree: number;
  nodes: NodeRef[];
  adminConfigured: boolean;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// ─── CodeMirror theme mapped to CSS variables ───────────────────────────────

const agentTaleTheme = EditorView.theme({
  '&': { height: '100%', backgroundColor: 'transparent' },
  '.cm-scroller': { overflow: 'auto', fontFamily: 'var(--font-body)', lineHeight: '1.75' },
  '.cm-content': {
    padding: '2rem 2.5rem',
    maxWidth: '52rem',
    caretColor: 'var(--color-accent)',
    fontSize: 'clamp(1rem, 0.95rem + 0.25vw, 1.125rem)',
  },
  '.cm-cursor': { borderLeftColor: 'var(--color-accent)' },
  '.cm-activeLine': { backgroundColor: 'transparent' },
  '.cm-gutters': {
    backgroundColor: 'var(--color-bg)',
    borderRight: '1px solid var(--color-border)',
    color: 'var(--color-text-tertiary)',
    fontSize: '0.75rem',
    minWidth: '2.5rem',
  },
  '.cm-lineNumbers .cm-gutterElement': { paddingInline: '0.5rem' },
  '.cm-selectionBackground': { backgroundColor: 'var(--color-selection) !important' },
  '.cm-focused .cm-selectionBackground': { backgroundColor: 'var(--color-selection)' },
  '.cm-tooltip': {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-border-strong)',
    borderRadius: '6px',
    boxShadow: '0 4px 16px oklch(0 0 0 / 0.15)',
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul': {
    fontFamily: 'var(--font-heading)',
    fontSize: '0.85rem',
    maxHeight: '14rem',
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li': {
    padding: '0.35rem 0.75rem',
    color: 'var(--color-text)',
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': {
    backgroundColor: 'var(--color-accent)',
    color: 'var(--color-bg)',
  },
  '.cm-completionDetail': { opacity: '0.6', fontSize: '0.8em', marginLeft: '0.5em' },
});

// ─── Wikilink autocomplete extension ─────────────────────────────────────────

function wikilinkCompletion(nodes: NodeRef[]) {
  return autocompletion({
    override: [(ctx: CompletionContext) => {
      const match = ctx.matchBefore(/\[\[[^\]]*$/);
      if (!match) return null;
      const query = match.text.slice(2).toLowerCase();
      const options = nodes
        .filter(n => n.title.toLowerCase().includes(query) || n.slug.includes(query))
        .slice(0, 20)
        .map(n => ({
          label: n.title,
          detail: n.slug,
          apply: `${n.slug}]]`,
        }));
      if (!options.length && !ctx.explicit) return null;
      return { from: match.from + 2, options, validFor: /^[^\]]*$/ };
    }],
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PostEditor({ slug, frontmatter, content, inDegree, outDegree, nodes, adminConfigured }: Props) {
  const [token, setTokenState] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [fm, setFm] = useState({
    title: String(frontmatter.title ?? ''),
    description: String(frontmatter.description ?? ''),
    date: String(frontmatter.date ?? ''),
    tags: Array.isArray(frontmatter.tags) ? (frontmatter.tags as string[]).join(', ') : '',
    draft: Boolean(frontmatter.draft ?? false),
  });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    setTokenState(sessionStorage.getItem(TOKEN_KEY));
  }, []);

  // ─── Init CodeMirror ───────────────────────────────────────────────────────

  const save = useCallback(async () => {
    const view = viewRef.current;
    if (!view) return;
    const t = sessionStorage.getItem(TOKEN_KEY) ?? '';
    setSaveStatus('saving');

    const tags = fm.tags.split(',').map(t => t.trim()).filter(Boolean);
    const payload = {
      frontmatter: {
        ...frontmatter,
        title: fm.title,
        description: fm.description || undefined,
        date: fm.date,
        tags,
        draft: fm.draft,
      },
      content: view.state.doc.toString(),
    };

    try {
      const res = await fetch(`/api/posts/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        sessionStorage.removeItem(TOKEN_KEY);
        setTokenState(null);
        setSaveStatus('error');
        return;
      }
      setSaveStatus(res.ok ? 'saved' : 'error');
      if (res.ok) setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
    }
  }, [fm, frontmatter, slug]);

  useEffect(() => {
    if (!editorRef.current || viewRef.current || !token) return;

    const saveKeymap = keymap.of([{
      key: 'Mod-s',
      run: () => { save(); return true; },
    }]);

    const view = new EditorView({
      state: EditorState.create({
        doc: content,
        extensions: [
          basicSetup,
          markdown(),
          wikilinkCompletion(nodes),
          agentTaleTheme,
          saveKeymap,
          EditorView.lineWrapping,
        ],
      }),
      parent: editorRef.current,
    });

    viewRef.current = view;
    return () => { view.destroy(); viewRef.current = null; };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Token gate ───────────────────────────────────────────────────────────

  if (!adminConfigured) {
    return (
      <div style={gateStyle}>
        <p style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-heading)' }}>
          Admin not configured. Set <code style={codeStyle}>ADMIN_SECRET</code> env var and restart.
        </p>
      </div>
    );
  }

  if (!token) {
    return (
      <div style={gateStyle}>
        <form
          onSubmit={e => { e.preventDefault(); sessionStorage.setItem(TOKEN_KEY, tokenInput); setTokenState(tokenInput); }}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start' }}
        >
          <label style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
            Admin token
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="password"
              autoFocus
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              placeholder="Enter ADMIN_SECRET"
              style={inputStyle}
            />
            <button type="submit" style={btnStyle}>Unlock</button>
          </div>
        </form>
      </div>
    );
  }

  // ─── Editor UI ────────────────────────────────────────────────────────────

  const statusLabel = saveStatus === 'saving' ? 'Saving…'
    : saveStatus === 'saved' ? 'Saved'
    : saveStatus === 'error' ? 'Error'
    : null;

  const statusColor = saveStatus === 'saved' ? 'oklch(0.55 0.15 145)'
    : saveStatus === 'error' ? 'oklch(0.55 0.2 25)'
    : 'var(--color-text-tertiary)';

  return (
    <>
      <style>{`
        .admin-editor-wrap { display: flex; flex-direction: column; height: 100dvh; background: var(--color-bg); }
        .admin-toolbar { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1.25rem;
          border-bottom: 1px solid var(--color-border); font-family: var(--font-heading); font-size: 0.85rem; flex-shrink: 0; }
        .admin-toolbar a { color: var(--color-text-secondary); text-decoration: none; }
        .admin-toolbar a:hover { color: var(--color-accent); }
        .admin-slug { color: var(--color-text-tertiary); font-family: var(--font-mono); font-size: 0.8rem; }
        .admin-connections { color: var(--color-text-tertiary); font-size: 0.8rem; margin-left: auto; }
        .admin-connections span { color: var(--color-accent); font-weight: 600; }
        .admin-body { display: flex; flex: 1; overflow: hidden; }
        .admin-sidebar { width: 260px; flex-shrink: 0; border-right: 1px solid var(--color-border);
          padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; }
        .admin-editor { flex: 1; overflow: hidden; }
        .admin-editor .cm-editor { height: 100%; }
        .admin-field label { display: block; font-family: var(--font-heading); font-size: 0.75rem;
          font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--color-text-tertiary);
          margin-bottom: 0.3rem; }
        .admin-field input, .admin-field textarea {
          width: 100%; box-sizing: border-box; padding: 0.4rem 0.6rem;
          background: var(--color-surface); border: 1px solid var(--color-border-strong);
          border-radius: 5px; color: var(--color-text); font-size: 0.875rem;
          font-family: var(--font-heading); outline: none; resize: none; }
        .admin-field input:focus, .admin-field textarea:focus { border-color: var(--color-accent); }
        .admin-draft-row { display: flex; align-items: center; gap: 0.5rem; font-family: var(--font-heading);
          font-size: 0.85rem; color: var(--color-text-secondary); cursor: pointer; }
        .admin-draft-row input[type=checkbox] { accent-color: var(--color-accent); width: 14px; height: 14px; }
        @media (max-width: 640px) {
          .admin-body { flex-direction: column; }
          .admin-sidebar { width: 100%; border-right: none; border-bottom: 1px solid var(--color-border); }
        }
      `}</style>

      <div className="admin-editor-wrap">
        {/* Toolbar */}
        <div className="admin-toolbar">
          <a href="/admin">← Tales</a>
          <span className="admin-slug">{slug}</span>
          <span className="admin-connections">
            ○ <span>{inDegree}↑</span> <span>{outDegree}↓</span>
          </span>
          {statusLabel && (
            <span style={{ color: statusColor, fontSize: '0.8rem' }}>{statusLabel}</span>
          )}
          <button onClick={save} style={btnStyle}>Save</button>
        </div>

        <div className="admin-body">
          {/* Frontmatter sidebar */}
          <div className="admin-sidebar">
            <div className="admin-field">
              <label>Title</label>
              <input value={fm.title} onChange={e => setFm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="admin-field">
              <label>Description</label>
              <textarea rows={2} value={fm.description} onChange={e => setFm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="admin-field">
              <label>Date</label>
              <input type="date" value={fm.date} onChange={e => setFm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div className="admin-field">
              <label>Tags</label>
              <input
                value={fm.tags}
                onChange={e => setFm(p => ({ ...p, tags: e.target.value }))}
                placeholder="graph, memory, devlog"
              />
            </div>
            <label className="admin-draft-row">
              <input
                type="checkbox"
                checked={fm.draft}
                onChange={e => setFm(p => ({ ...p, draft: e.target.checked }))}
              />
              Draft
            </label>
          </div>

          {/* CodeMirror editor */}
          <div className="admin-editor" ref={editorRef} />
        </div>
      </div>
    </>
  );
}

// ─── Shared micro-styles ─────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  padding: '0.45rem 0.75rem',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border-strong)',
  borderRadius: '6px',
  color: 'var(--color-text)',
  fontSize: '0.9rem',
  fontFamily: 'var(--font-heading)',
  outline: 'none',
  width: '18rem',
};

const btnStyle: React.CSSProperties = {
  padding: '0.4rem 1rem',
  background: 'var(--color-accent)',
  color: 'var(--color-bg)',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontFamily: 'var(--font-heading)',
  fontSize: '0.875rem',
  fontWeight: 600,
  flexShrink: 0,
};

const gateStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100dvh',
  background: 'var(--color-bg)',
};

const codeStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.85em',
  background: 'var(--color-code-bg)',
  padding: '0.1em 0.4em',
  borderRadius: '4px',
};
