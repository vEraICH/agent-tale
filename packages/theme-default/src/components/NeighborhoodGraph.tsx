/**
 * NeighborhoodGraph — mini force-directed graph for a single post.
 *
 * Shows the current post + depth-1 and depth-2 neighbors in a compact
 * canvas visualization. Click any neighbor to navigate to it.
 */

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceX,
  forceY,
} from 'd3-force';
import type { SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';

// ─── Types ────────────────────────────────────────────────────

interface NodeData {
  slug: string;
  title: string;
  inDegree: number;
  outDegree: number;
  tags: string[];
}

interface EdgeData {
  source: string;
  target: string;
}

export interface Props {
  slug: string;
  nodes: NodeData[];
  edges: EdgeData[];
  basePath?: string;
}

interface MiniNode extends SimulationNodeDatum {
  slug: string;
  title: string;
  depth: number; // 0=current, 1=direct neighbor, 2=depth-2
  radius: number;
  degree: number;
}

interface MiniLink extends SimulationLinkDatum<MiniNode> {
  source: MiniNode | string;
  target: MiniNode | string;
  depth: number; // max depth of the two endpoints
}

// ─── Theme ────────────────────────────────────────────────────

interface ThemeColors {
  accent: string;
  border: string;
  borderStrong: string;
  surface: string;
  text: string;
  textTertiary: string;
  bg: string;
  isDark: boolean;
}

function readTheme(): ThemeColors {
  const style = getComputedStyle(document.documentElement);
  const get = (p: string, fb: string) => style.getPropertyValue(p).trim() || fb;
  const isDark =
    document.documentElement.getAttribute('data-theme') === 'dark' ||
    (document.documentElement.getAttribute('data-theme') !== 'light' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  return {
    accent:       get('--color-accent',        isDark ? '#b68aef' : '#c07830'),
    border:       get('--color-border',        isDark ? '#302a40' : '#e0ddd8'),
    borderStrong: get('--color-border-strong', isDark ? '#4a4060' : '#c8c4bc'),
    surface:      get('--color-surface',       isDark ? '#222040' : '#eeece8'),
    text:         get('--color-text',          isDark ? '#e8e4de' : '#2e2a26'),
    textTertiary: get('--color-text-tertiary', isDark ? '#656070' : '#908880'),
    bg:           get('--color-bg',            isDark ? '#1a1730' : '#f7f5f0'),
    isDark,
  };
}

// ─── BFS neighborhood builder ─────────────────────────────────

function buildNeighborhood(
  slug: string,
  nodes: NodeData[],
  edges: EdgeData[],
  maxDepth = 2,
): { miniNodes: MiniNode[]; miniLinks: MiniLink[] } {
  // Build undirected adjacency
  const adj = new Map<string, Set<string>>();
  for (const e of edges) {
    if (!adj.has(e.source)) adj.set(e.source, new Set());
    if (!adj.has(e.target)) adj.set(e.target, new Set());
    adj.get(e.source)!.add(e.target);
    adj.get(e.target)!.add(e.source);
  }

  // BFS
  const depthMap = new Map<string, number>();
  depthMap.set(slug, 0);
  const queue = [slug];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    const curDepth = depthMap.get(cur)!;
    if (curDepth >= maxDepth) continue;
    for (const nb of (adj.get(cur) ?? [])) {
      if (!depthMap.has(nb)) {
        depthMap.set(nb, curDepth + 1);
        queue.push(nb);
      }
    }
  }

  const nodeMap = new Map(nodes.map((n) => [n.slug, n]));

  // Build degree counts within the neighborhood for radius sizing
  const neighborhoodSlugs = new Set(depthMap.keys());
  const localDegree = new Map<string, number>();
  for (const e of edges) {
    if (neighborhoodSlugs.has(e.source) && neighborhoodSlugs.has(e.target)) {
      localDegree.set(e.source, (localDegree.get(e.source) ?? 0) + 1);
      localDegree.set(e.target, (localDegree.get(e.target) ?? 0) + 1);
    }
  }

  const miniNodes: MiniNode[] = [];
  for (const [s, depth] of depthMap) {
    const n = nodeMap.get(s);
    if (!n) continue;
    const degree = localDegree.get(s) ?? 0;
    const radius = depth === 0
      ? 9
      : depth === 1
        ? Math.max(5, Math.min(8, 4 + degree))
        : 4;
    miniNodes.push({
      slug: s,
      title: n.title,
      depth,
      radius,
      degree,
      // Spread nodes radially so force layout starts from a sane position
      x: depth === 0 ? 0 : Math.cos(Math.random() * Math.PI * 2) * (depth * 80),
      y: depth === 0 ? 0 : Math.sin(Math.random() * Math.PI * 2) * (depth * 80),
    });
  }

  // Edges within the neighborhood
  const miniLinks: MiniLink[] = [];
  for (const e of edges) {
    if (depthMap.has(e.source) && depthMap.has(e.target)) {
      const d = Math.max(depthMap.get(e.source)!, depthMap.get(e.target)!);
      miniLinks.push({ source: e.source, target: e.target, depth: d });
    }
  }

  return { miniNodes, miniLinks };
}

// ─── Canvas renderer ──────────────────────────────────────────

function truncate(text: string, maxLen: number): string {
  return text.length <= maxLen ? text : text.slice(0, maxLen - 1) + '…';
}

function renderFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  dpr: number,
  nodes: MiniNode[],
  links: MiniLink[],
  theme: ThemeColors,
  hoveredSlug: string | null,
  currentSlug: string,
) {
  ctx.clearRect(0, 0, w * dpr, h * dpr);

  const cx = w / 2;
  const cy = h / 2;

  // ── Edges ──
  for (const link of links) {
    const s = link.source as MiniNode;
    const t = link.target as MiniNode;
    if (s.x == null || s.y == null || t.x == null || t.y == null) continue;

    const isHovered =
      hoveredSlug != null && (s.slug === hoveredSlug || t.slug === hoveredSlug);

    ctx.beginPath();
    ctx.moveTo((cx + s.x) * dpr, (cy + s.y) * dpr);
    ctx.lineTo((cx + t.x) * dpr, (cy + t.y) * dpr);
    ctx.strokeStyle = isHovered
      ? theme.borderStrong
      : theme.border;
    ctx.globalAlpha = link.depth === 1 ? 0.7 : 0.35;
    ctx.lineWidth = dpr;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // ── Nodes ──
  for (const node of nodes) {
    if (node.x == null || node.y == null) continue;
    const nx = (cx + node.x) * dpr;
    const ny = (cy + node.y) * dpr;
    const r = node.radius * dpr;

    const isCurrent = node.slug === currentSlug;
    const isHovered = node.slug === hoveredSlug;

    // Glow for current or hovered
    if (isCurrent || isHovered) {
      ctx.beginPath();
      ctx.arc(nx, ny, r * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = theme.accent;
      ctx.globalAlpha = 0.08;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Node circle
    ctx.beginPath();
    ctx.arc(nx, ny, r, 0, Math.PI * 2);

    if (isCurrent) {
      ctx.fillStyle = theme.accent;
      ctx.globalAlpha = 1;
    } else if (node.depth === 1) {
      ctx.fillStyle = theme.accent;
      ctx.globalAlpha = isHovered ? 0.9 : 0.55;
    } else {
      ctx.fillStyle = theme.textTertiary;
      ctx.globalAlpha = isHovered ? 0.7 : 0.4;
    }
    ctx.fill();
    ctx.globalAlpha = 1;

    // Border ring
    if (isCurrent || isHovered) {
      ctx.beginPath();
      ctx.arc(nx, ny, r, 0, Math.PI * 2);
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = (isCurrent ? 2 : 1.5) * dpr;
      ctx.globalAlpha = isCurrent ? 0.9 : 0.6;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Label
    const labelMaxLen = isCurrent ? 22 : node.depth === 1 ? 18 : 14;
    const label = truncate(node.title, labelMaxLen);
    const fontSize = (isCurrent ? 11 : 10) * dpr;
    ctx.font = `${isCurrent ? 600 : 400} ${fontSize}px system-ui, sans-serif`;
    ctx.fillStyle = isCurrent ? theme.text : isHovered ? theme.text : theme.textTertiary;
    ctx.globalAlpha = isCurrent ? 1 : node.depth === 1 ? 0.85 : 0.55;
    ctx.textAlign = 'center';
    ctx.fillText(label, nx, ny + r * 1 + fontSize * 1.2);
    ctx.globalAlpha = 1;
  }
}

// ─── Hit test ─────────────────────────────────────────────────

function hitTest(
  mx: number,
  my: number,
  w: number,
  h: number,
  nodes: MiniNode[],
): MiniNode | null {
  const cx = w / 2;
  const cy = h / 2;
  let closest: MiniNode | null = null;
  let minDist = Infinity;
  for (const node of nodes) {
    if (node.x == null || node.y == null) continue;
    const dx = mx - (cx + node.x);
    const dy = my - (cy + node.y);
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= node.radius + 6 && dist < minDist) {
      minDist = dist;
      closest = node;
    }
  }
  return closest;
}

// ─── Component ────────────────────────────────────────────────

export default function NeighborhoodGraph({
  slug,
  nodes,
  edges,
  basePath = '/posts/',
}: Props) {
  const { miniNodes, miniLinks } = useMemo(
    () => buildNeighborhood(slug, nodes, edges),
    [slug],
  );

  // Nothing to show for isolated posts
  if (miniNodes.length <= 1) return null;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const simRef = useRef<ReturnType<typeof forceSimulation> | null>(null);
  const nodesRef = useRef<MiniNode[]>(miniNodes);
  const linksRef = useRef<MiniLink[]>(miniLinks);
  const themeRef = useRef<ThemeColors | null>(null);
  const hoveredRef = useRef<string | null>(null);
  const sizeRef = useRef({ w: 400, h: 220 });

  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !themeRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { w, h } = sizeRef.current;
    renderFrame(
      ctx, w, h,
      window.devicePixelRatio || 1,
      nodesRef.current,
      linksRef.current,
      themeRef.current,
      hoveredRef.current,
      slug,
    );
  }, [slug]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    themeRef.current = readTheme();
    const dpr = window.devicePixelRatio || 1;

    // Size canvas to container
    const rect = container.getBoundingClientRect();
    const w = rect.width || 500;
    const h = 220;
    sizeRef.current = { w, h };
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    // Build simulation
    const sim = forceSimulation<MiniNode>(nodesRef.current)
      .force(
        'link',
        forceLink<MiniNode, MiniLink>(linksRef.current)
          .id((d) => d.slug)
          .distance((link) => {
            const d = link.depth as number;
            return d === 1 ? 75 : 55;
          })
          .strength(0.4),
      )
      .force('charge', forceManyBody<MiniNode>().strength(-180))
      .force('x', forceX<MiniNode>(0).strength(0.08))
      .force('y', forceY<MiniNode>(0).strength(0.08))
      .force('collide', forceCollide<MiniNode>().radius((d) => d.radius + 14))
      .alphaDecay(0.02)
      .alphaMin(0.001)
      .stop();

    // Pin center node at origin
    const center = nodesRef.current.find((n) => n.slug === slug);
    if (center) {
      center.fx = 0;
      center.fy = 0;
    }

    // Warmup
    for (let i = 0; i < 150; i++) sim.tick();

    sim.on('tick', draw);
    sim.restart();
    simRef.current = sim;

    // Draw initial frame
    draw();

    // Listen for theme changes
    const observer = new MutationObserver(() => {
      themeRef.current = readTheme();
      draw();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      sim.stop();
      observer.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Re-draw when hovered changes
  useEffect(() => {
    hoveredRef.current = hoveredSlug;
    draw();
  }, [hoveredSlug, draw]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const { w, h } = sizeRef.current;
    const hit = hitTest(mx, my, w, h, nodesRef.current);
    setHoveredSlug(hit ? hit.slug : null);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredSlug(null);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const { w, h } = sizeRef.current;
    const hit = hitTest(mx, my, w, h, nodesRef.current);
    if (hit && hit.slug !== slug) {
      window.location.href = `${basePath}${hit.slug}`;
    }
  }, [slug, basePath]);

  const neighborCount = miniNodes.length - 1;
  const cursor = hoveredSlug && hoveredSlug !== slug ? 'pointer' : 'default';

  return (
    <div className="ng-wrap" ref={containerRef}>
      <div className="ng-header">
        <span className="ng-title">Neighborhood</span>
        <span className="ng-meta">{neighborCount} connected {neighborCount === 1 ? 'tale' : 'tales'}</span>
        <a href="/graph" className="ng-graph-link">Full graph →</a>
      </div>
      <canvas
        ref={canvasRef}
        className="ng-canvas"
        style={{ cursor }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        aria-label={`Neighborhood graph: ${neighborCount} connected posts`}
      />
    </div>
  );
}
