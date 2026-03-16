/**
 * Camera — zoom-at-point, pan with inertia, smooth lerp transitions.
 *
 * The camera stores world-space coordinates and scale. All transforms
 * go through worldToScreen / screenToWorld so the renderer doesn't
 * need to think about the camera math.
 */

import type { Camera, SimNode } from './types';
import {
  CAMERA_MIN_SCALE,
  CAMERA_MAX_SCALE,
  CAMERA_ZOOM_FACTOR,
  CAMERA_LERP_SPEED,
  CAMERA_INERTIA_DECAY,
  CAMERA_INERTIA_MIN,
} from './constants';

export function createCamera(): Camera {
  return {
    x: 0,
    y: 0,
    scale: 1,
    targetX: 0,
    targetY: 0,
    targetScale: 1,
    vx: 0,
    vy: 0,
  };
}

/** Convert world coordinates to screen (canvas pixel) coordinates. */
export function worldToScreen(
  cam: Camera,
  wx: number,
  wy: number,
  canvasW: number,
  canvasH: number,
): [number, number] {
  const sx = (wx - cam.x) * cam.scale + canvasW / 2;
  const sy = (wy - cam.y) * cam.scale + canvasH / 2;
  return [sx, sy];
}

/** Convert screen (canvas pixel) coordinates to world coordinates. */
export function screenToWorld(
  cam: Camera,
  sx: number,
  sy: number,
  canvasW: number,
  canvasH: number,
): [number, number] {
  const wx = (sx - canvasW / 2) / cam.scale + cam.x;
  const wy = (sy - canvasH / 2) / cam.scale + cam.y;
  return [wx, wy];
}

/**
 * Zoom at a specific screen point — keeps the world point under the
 * cursor stationary while the scale changes.
 */
export function zoomAtPoint(
  cam: Camera,
  screenX: number,
  screenY: number,
  delta: number,
  canvasW: number,
  canvasH: number,
): void {
  // World point under cursor before zoom
  const [wx, wy] = screenToWorld(cam, screenX, screenY, canvasW, canvasH);

  // New scale
  const factor = 1 - delta * CAMERA_ZOOM_FACTOR;
  const newScale = clampScale(cam.targetScale * factor);

  // Adjust target position so world point stays under cursor
  cam.targetScale = newScale;
  cam.targetX = wx - (screenX - canvasW / 2) / newScale;
  cam.targetY = wy - (screenY - canvasH / 2) / newScale;
}

/** Pan the camera target by screen-space deltas. */
export function pan(cam: Camera, dsx: number, dsy: number): void {
  cam.targetX -= dsx / cam.scale;
  cam.targetY -= dsy / cam.scale;
  cam.vx = dsx;
  cam.vy = dsy;
}

/** Apply inertia decay to velocity and move target. Returns true if still moving. */
export function applyInertia(cam: Camera): boolean {
  if (Math.abs(cam.vx) < CAMERA_INERTIA_MIN && Math.abs(cam.vy) < CAMERA_INERTIA_MIN) {
    cam.vx = 0;
    cam.vy = 0;
    return false;
  }
  cam.vx *= CAMERA_INERTIA_DECAY;
  cam.vy *= CAMERA_INERTIA_DECAY;
  cam.targetX -= cam.vx / cam.scale;
  cam.targetY -= cam.vy / cam.scale;
  return true;
}

/**
 * Lerp camera toward target. Returns true if the camera is still moving
 * (delta above threshold).
 */
export function lerpCamera(cam: Camera): boolean {
  const dx = cam.targetX - cam.x;
  const dy = cam.targetY - cam.y;
  const ds = cam.targetScale - cam.scale;

  cam.x += dx * CAMERA_LERP_SPEED;
  cam.y += dy * CAMERA_LERP_SPEED;
  cam.scale += ds * CAMERA_LERP_SPEED;

  // Snap if close enough
  const moving = Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01 || Math.abs(ds) > 0.0001;
  if (!moving) {
    cam.x = cam.targetX;
    cam.y = cam.targetY;
    cam.scale = cam.targetScale;
  }
  return moving;
}

/** Fit the camera to show all given nodes with some padding. */
export function fitToNodes(
  cam: Camera,
  nodes: SimNode[],
  canvasW: number,
  canvasH: number,
  padding = 60,
): void {
  if (nodes.length === 0) return;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const n of nodes) {
    if (n.x == null || n.y == null) continue;
    minX = Math.min(minX, n.x - n.radius);
    maxX = Math.max(maxX, n.x + n.radius);
    minY = Math.min(minY, n.y - n.radius);
    maxY = Math.max(maxY, n.y + n.radius);
  }

  if (!isFinite(minX)) return;

  const graphW = maxX - minX + padding * 2;
  const graphH = maxY - minY + padding * 2;

  cam.targetScale = clampScale(Math.min(canvasW / graphW, canvasH / graphH));
  cam.targetX = (minX + maxX) / 2;
  cam.targetY = (minY + maxY) / 2;
}

/** Smooth-zoom to center on a specific world point. */
export function zoomToPoint(cam: Camera, wx: number, wy: number, scale: number): void {
  cam.targetX = wx;
  cam.targetY = wy;
  cam.targetScale = clampScale(scale);
}

function clampScale(s: number): number {
  return Math.max(CAMERA_MIN_SCALE, Math.min(CAMERA_MAX_SCALE, s));
}
