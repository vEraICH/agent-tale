/**
 * Renderer — Canvas 2D draw pipeline.
 *
 * Draw order: bg stars → edges (batched by alpha) → glow halos →
 * node cores → labels. LOD system controls what gets drawn at each
 * zoom level. Offscreen culling skips invisible elements.
 */

import type { Camera, SimNode, SimLink, LODLevel, ThemeColors, BgStar, FocusState } from './types';
import { worldToScreen } from './camera';
import {
  LOD_POINTS_MAX,
  LOD_CIRCLES_MAX,
  LOD_LABELS_MAX,
  LOD_LABEL_MIN_DEGREE,
  EDGE_ALPHA_NORMAL,
  EDGE_ALPHA_HIGHLIGHT,
  GLOW_BLUR_BASE,
  GLOW_BLUR_HIGH,
  GLOW_HALO_RADIUS_MULT,
  LABEL_FONT_SIZE,
  LABEL_FONT_WEIGHT,
  LABEL_MAX_WIDTH,
  LABEL_OFFSET_Y,
  BG_STAR_COUNT,
  BG_STAR_PARALLAX,
  BG_STAR_MIN_SIZE,
  BG_STAR_MAX_SIZE,
  BG_STAR_TWINKLE_AMP,
  NODE_COLORS,
  NODE_COLORS_LIGHT,
} from './constants';

// ─── LOD ─────────────────────────────────────────────────────

export function getLOD(scale: number): LODLevel {
  if (scale < LOD_POINTS_MAX) return 'points';
  if (scale < LOD_CIRCLES_MAX) return 'circles';
  if (scale < LOD_LABELS_MAX) return 'labels';
  return 'full';
}

// ─── Background stars ────────────────────────────────────────

export function createBgStars(): BgStar[] {
  const stars: BgStar[] = [];
  // Stars use normalized [0,1] coordinates — mapped to screen each frame
  for (let i = 0; i < BG_STAR_COUNT; i++) {
    stars.push({
      x: Math.random(),
      y: Math.random(),
      size: BG_STAR_MIN_SIZE + Math.random() * (BG_STAR_MAX_SIZE - BG_STAR_MIN_SIZE),
      brightness: 0.3 + Math.random() * 0.7,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.3 + Math.random() * 0.7,
    });
  }
  return stars;
}

// ─── Culling ─────────────────────────────────────────────────

function isOnScreen(sx: number, sy: number, margin: number, w: number, h: number): boolean {
  return sx > -margin && sx < w + margin && sy > -margin && sy < h + margin;
}

// ─── Node color ──────────────────────────────────────────────

function getNodeColor(node: SimNode, theme: ThemeColors): string {
  const colors = theme.isDark ? NODE_COLORS : NODE_COLORS_LIGHT;
  return colors[node.nodeType] ?? theme.accent;
}

// ─── Main draw ───────────────────────────────────────────────

export function draw(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  nodes: SimNode[],
  links: SimLink[],
  theme: ThemeColors,
  bgStars: BgStar[],
  time: number,
  canvasW: number,
  canvasH: number,
  hoveredSlug: string | null,
  focus: FocusState | null,
): void {
  const lod = getLOD(cam.scale);

  // ── Clear ──
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // ── Background stars (dark mode only) ──
  if (theme.isDark) {
    drawBgStars(ctx, cam, bgStars, time, canvasW, canvasH);
  }

  // ── Edges ──
  if (lod !== 'points') {
    drawEdges(ctx, cam, links, canvasW, canvasH, hoveredSlug, focus, theme);
  }

  // ── Glow halos (dark mode, circles+ LOD) ──
  if (theme.isDark && lod !== 'points') {
    drawGlowHalos(ctx, cam, nodes, canvasW, canvasH, theme);
  }

  // ── Nodes ──
  drawNodes(ctx, cam, nodes, canvasW, canvasH, lod, theme, hoveredSlug);

  // ── Labels ──
  if (lod === 'labels' || lod === 'full') {
    drawLabels(ctx, cam, nodes, canvasW, canvasH, lod, theme, hoveredSlug);
  }
}

// ─── Sub-draw functions ──────────────────────────────────────

function drawBgStars(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  stars: BgStar[],
  time: number,
  w: number,
  h: number,
): void {
  // Parallax offset — subtle drift as camera moves
  const offX = cam.x * BG_STAR_PARALLAX;
  const offY = cam.y * BG_STAR_PARALLAX;

  for (const star of stars) {
    // Map normalized [0,1] to screen, with parallax offset and wrapping
    let sx = ((star.x * w - offX) % w + w) % w;
    let sy = ((star.y * h - offY) % h + h) % h;

    const twinkle = 1 - BG_STAR_TWINKLE_AMP + BG_STAR_TWINKLE_AMP * Math.sin(time * star.twinkleSpeed + star.twinklePhase);
    const alpha = star.brightness * twinkle;

    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#e0dce8';
    ctx.beginPath();
    ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawEdges(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  links: SimLink[],
  w: number,
  h: number,
  hoveredSlug: string | null,
  focus: FocusState | null,
  theme: ThemeColors,
): void {
  // Batch edges by alpha bucket to minimize state changes
  const normal: SimLink[] = [];
  const highlighted: SimLink[] = [];

  for (const link of links) {
    const s = link.source as SimNode;
    const t = link.target as SimNode;
    if (s.x == null || t.x == null) continue;

    const isHighlighted =
      hoveredSlug != null &&
      ((s.slug === hoveredSlug) || (t.slug === hoveredSlug));

    if (isHighlighted) {
      highlighted.push(link);
    } else {
      normal.push(link);
    }
  }

  // Draw normal edges
  ctx.lineWidth = 1;
  ctx.strokeStyle = theme.isDark ? 'rgba(200,195,220,1)' : 'rgba(100,90,80,1)';
  for (const link of normal) {
    const s = link.source as SimNode;
    const t = link.target as SimNode;
    const [sx1, sy1] = worldToScreen(cam, s.x!, s.y!, w, h);
    const [sx2, sy2] = worldToScreen(cam, t.x!, t.y!, w, h);

    // Cull if both endpoints offscreen
    if (!isOnScreen(sx1, sy1, 0, w, h) && !isOnScreen(sx2, sy2, 0, w, h)) continue;

    const edgeOpacity = Math.min(s.opacity, t.opacity) * EDGE_ALPHA_NORMAL;
    ctx.globalAlpha = edgeOpacity;
    ctx.beginPath();
    ctx.moveTo(sx1, sy1);
    ctx.lineTo(sx2, sy2);
    ctx.stroke();
  }

  // Draw highlighted edges
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = theme.accent;
  for (const link of highlighted) {
    const s = link.source as SimNode;
    const t = link.target as SimNode;
    const [sx1, sy1] = worldToScreen(cam, s.x!, s.y!, w, h);
    const [sx2, sy2] = worldToScreen(cam, t.x!, t.y!, w, h);

    const edgeOpacity = Math.min(s.opacity, t.opacity) * EDGE_ALPHA_HIGHLIGHT;
    ctx.globalAlpha = edgeOpacity;
    ctx.beginPath();
    ctx.moveTo(sx1, sy1);
    ctx.lineTo(sx2, sy2);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

function drawGlowHalos(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  nodes: SimNode[],
  w: number,
  h: number,
  theme: ThemeColors,
): void {
  for (const node of nodes) {
    if (node.x == null || node.opacity < 0.05 || node.glowIntensity < 0.1) continue;

    const [sx, sy] = worldToScreen(cam, node.x, node.y!, w, h);
    const screenR = node.radius * cam.scale;

    if (!isOnScreen(sx, sy, screenR * 3, w, h)) continue;
    if (screenR < 2) continue; // Too small for glow

    const color = getNodeColor(node, theme);
    const glowR = screenR * GLOW_HALO_RADIUS_MULT;
    const blur = node.glowIntensity > 0.7 ? GLOW_BLUR_HIGH : GLOW_BLUR_BASE;

    ctx.globalAlpha = node.opacity * node.glowIntensity * 0.4;
    ctx.shadowColor = color;
    ctx.shadowBlur = blur * cam.scale;

    // Radial gradient halo
    const grad = ctx.createRadialGradient(sx, sy, screenR * 0.3, sx, sy, glowR);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sx, sy, glowR, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;
}

function drawNodes(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  nodes: SimNode[],
  w: number,
  h: number,
  lod: LODLevel,
  theme: ThemeColors,
  hoveredSlug: string | null,
): void {
  for (const node of nodes) {
    if (node.x == null || node.opacity < 0.02) continue;

    const [sx, sy] = worldToScreen(cam, node.x, node.y!, w, h);
    const screenR = node.radius * cam.scale;

    if (!isOnScreen(sx, sy, screenR + 4, w, h)) continue;

    ctx.globalAlpha = node.opacity;

    if (lod === 'points') {
      // Tiny dot
      const dotSize = Math.max(1, screenR * 0.4);
      ctx.fillStyle = getNodeColor(node, theme);
      ctx.beginPath();
      ctx.arc(sx, sy, dotSize, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const isHovered = node.slug === hoveredSlug;
      const color = getNodeColor(node, theme);

      // Glow via shadow (dark mode)
      if (theme.isDark) {
        ctx.shadowColor = color;
        ctx.shadowBlur = (isHovered ? GLOW_BLUR_HIGH : GLOW_BLUR_BASE) * Math.min(1, cam.scale);
      }

      // Node core — bright near-white center for star effect
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(sx, sy, screenR, 0, Math.PI * 2);
      ctx.fill();

      // Bright core (the "star" center)
      if (theme.isDark && screenR > 3) {
        ctx.fillStyle = 'rgba(255,252,245,0.7)';
        ctx.beginPath();
        ctx.arc(sx, sy, screenR * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Hover ring
      if (isHovered) {
        ctx.strokeStyle = theme.isDark ? 'rgba(255,252,245,0.6)' : color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy, screenR + 4 * cam.scale, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;
}

function drawLabels(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  nodes: SimNode[],
  w: number,
  h: number,
  lod: LODLevel,
  theme: ThemeColors,
  hoveredSlug: string | null,
): void {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  for (const node of nodes) {
    if (node.x == null || node.opacity < 0.1) continue;

    // At "labels" LOD, only show labels for high-degree or hovered nodes
    const isHovered = node.slug === hoveredSlug;
    if (lod === 'labels' && !isHovered && node.degree < LOD_LABEL_MIN_DEGREE) continue;

    const [sx, sy] = worldToScreen(cam, node.x, node.y!, w, h);
    const screenR = node.radius * cam.scale;

    if (!isOnScreen(sx, sy, LABEL_MAX_WIDTH, w, h)) continue;

    const fontSize = isHovered ? LABEL_FONT_SIZE + 2 : LABEL_FONT_SIZE;
    const weight = isHovered ? '600' : LABEL_FONT_WEIGHT;
    ctx.font = `${weight} ${fontSize}px "Space Grotesk", system-ui, sans-serif`;
    ctx.fillStyle = theme.text;
    ctx.globalAlpha = node.opacity * (isHovered ? 1 : 0.8);

    const label = node.title.length > 20 ? node.title.slice(0, 18) + '…' : node.title;
    ctx.fillText(label, sx, sy + screenR + LABEL_OFFSET_Y, LABEL_MAX_WIDTH);
  }
  ctx.globalAlpha = 1;
}
