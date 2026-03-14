/**
 * GraphView — Force-directed graph visualization.
 *
 * React island rendered on Canvas 2D. Uses d3-force for simulation.
 * Shows nodes as circles, edges as lines. Click to navigate.
 * Hover for title tooltip. Drag to rearrange.
 *
 * Ships as client:visible — only loads when scrolled into view.
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';

interface GraphNodeData {
  slug: string;
  title: string;
  tags: string[];
  agent: string | null;
  inDegree: number;
  outDegree: number;
}

interface GraphEdgeData {
  source: string;
  target: string;
}

interface Props {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  basePath?: string;
}

interface SimNode extends SimulationNodeDatum {
  slug: string;
  title: string;
  tags: string[];
  radius: number;
  isLesson: boolean;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  source: SimNode | string;
  target: SimNode | string;
}

export default function GraphView({ nodes, edges, basePath = '/posts/' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<SimNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  // Refs for simulation state (avoid re-renders)
  const simNodesRef = useRef<SimNode[]>([]);
  const simLinksRef = useRef<SimLink[]>([]);
  const dragRef = useRef<{ node: SimNode; moved: boolean } | null>(null);
  const simRef = useRef<ReturnType<typeof forceSimulation<SimNode>> | null>(null);

  // Build simulation data
  useEffect(() => {
    const simNodes: SimNode[] = nodes.map((n) => ({
      slug: n.slug,
      title: n.title,
      tags: n.tags,
      radius: Math.max(8, Math.min(18, 5 + (n.inDegree + n.outDegree) * 2)),
      isLesson: n.tags.includes('lesson'),
      x: undefined,
      y: undefined,
    }));

    const nodeMap = new Map(simNodes.map((n) => [n.slug, n]));
    const simLinks: SimLink[] = edges
      .filter((e) => nodeMap.has(e.source) && nodeMap.has(e.target))
      .map((e) => ({ source: e.source, target: e.target }));

    simNodesRef.current = simNodes;
    simLinksRef.current = simLinks;

    const sim = forceSimulation<SimNode>(simNodes)
      .force(
        'link',
        forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.slug)
          .distance(80)
          .strength(0.4),
      )
      .force('charge', forceManyBody().strength(-150))
      .force('center', forceCenter(dimensions.width / 2, dimensions.height / 2).strength(0.1))
      .force('collide', forceCollide<SimNode>().radius((d) => d.radius + 6))
      .alphaDecay(0.02)
      .on('tick', () => draw());

    simRef.current = sim;
    return () => { sim.stop(); simRef.current = null; };
  }, [nodes, edges, dimensions]);

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        const height = Math.max(400, Math.min(600, width * 0.6));
        setDimensions({ width, height });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    // Read CSS custom properties
    const style = getComputedStyle(document.documentElement);
    const bgColor = style.getPropertyValue('--color-bg').trim() || '#1a1714';
    const textColor = style.getPropertyValue('--color-text').trim() || '#e8e4de';
    const accentColor = style.getPropertyValue('--color-accent').trim() || '#d4943a';
    const borderColor = style.getPropertyValue('--color-border').trim() || '#353230';
    const tertiaryColor = style.getPropertyValue('--color-text-tertiary').trim() || '#6b6560';

    // Clear
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    const simNodes = simNodesRef.current;
    const simLinks = simLinksRef.current;

    // Draw edges
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    for (const link of simLinks) {
      const s = link.source as SimNode;
      const t = link.target as SimNode;
      if (s.x == null || t.x == null) continue;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y!);
      ctx.lineTo(t.x, t.y!);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Draw nodes
    for (const node of simNodes) {
      if (node.x == null) continue;

      const isHovered = hovered?.slug === node.slug;

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y!, node.radius, 0, Math.PI * 2);

      if (node.isLesson) {
        ctx.fillStyle = accentColor;
      } else if (isHovered) {
        ctx.fillStyle = accentColor;
      } else {
        ctx.fillStyle = tertiaryColor;
      }
      ctx.fill();

      // Hover ring
      if (isHovered) {
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(node.x, node.y!, node.radius + 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = textColor;
      ctx.font = `${isHovered ? '600 13px' : '500 11px'} "Space Grotesk", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.globalAlpha = isHovered ? 1 : 0.75;
      ctx.fillText(node.title, node.x, node.y! + node.radius + 6, 120);
      ctx.globalAlpha = 1;
    }
  }, [dimensions, hovered]);

  // Redraw on hover change
  useEffect(() => { draw(); }, [hovered, draw]);

  // Find node at position
  const nodeAt = useCallback((x: number, y: number): SimNode | null => {
    for (const node of simNodesRef.current) {
      if (node.x == null) continue;
      const dx = x - node.x;
      const dy = y - node.y!;
      if (dx * dx + dy * dy < (node.radius + 4) ** 2) return node;
    }
    return null;
  }, []);

  // Mouse handlers
  const getPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const { x, y } = getPos(e);

      if (dragRef.current) {
        dragRef.current.moved = true;
        dragRef.current.node.fx = x;
        dragRef.current.node.fy = y;
        // Reheat simulation so nodes react to drag
        simRef.current?.alpha(0.3).restart();
        return;
      }

      const node = nodeAt(x, y);
      setHovered(node);
      canvasRef.current!.style.cursor = node ? 'grab' : 'default';
    },
    [getPos, nodeAt],
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const { x, y } = getPos(e);
      const node = nodeAt(x, y);
      if (node) {
        e.preventDefault();
        dragRef.current = { node, moved: false };
        node.fx = node.x;
        node.fy = node.y;
        canvasRef.current!.style.cursor = 'grabbing';
      }
    },
    [getPos, nodeAt],
  );

  const onMouseUp = useCallback(() => {
    if (dragRef.current) {
      dragRef.current.node.fx = null;
      dragRef.current.node.fy = null;
      // Don't clear dragRef yet — onClick needs to check .moved
    }
    canvasRef.current!.style.cursor = 'default';
  }, []);

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      // If we were dragging, don't navigate
      if (dragRef.current?.moved) {
        dragRef.current = null;
        return;
      }
      dragRef.current = null;

      const { x, y } = getPos(e);
      const node = nodeAt(x, y);
      if (node) {
        window.location.href = `${basePath}${node.slug}`;
      }
    },
    [getPos, nodeAt, basePath],
  );

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{
          width: '100%',
          height: `${dimensions.height}px`,
          borderRadius: '6px',
          border: '1px solid var(--color-border)',
        }}
        onMouseMove={onMouseMove}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onClick={onClick}
      />
      {hovered && (
        <div
          style={{
            position: 'absolute',
            bottom: '0.75rem',
            left: '0.75rem',
            fontFamily: '"Space Grotesk", system-ui, sans-serif',
            fontSize: '0.8rem',
            color: 'var(--color-text-secondary)',
            pointerEvents: 'none',
          }}
        >
          {hovered.title}
          {hovered.tags.length > 0 && (
            <span style={{ opacity: 0.6, marginLeft: '0.5rem' }}>
              {hovered.tags.map((t) => `#${t}`).join(' ')}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
