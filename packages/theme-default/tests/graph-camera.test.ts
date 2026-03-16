/**
 * Camera tests — transforms, zoom-at-point, pan, fit, lerp.
 */

import { describe, it, expect } from 'vitest';
import {
  createCamera,
  worldToScreen,
  screenToWorld,
  zoomAtPoint,
  pan,
  lerpCamera,
  fitToNodes,
  zoomToPoint,
  applyInertia,
} from '../src/components/graph/camera';
import type { SimNode } from '../src/components/graph/types';

function makeNode(overrides: Partial<SimNode> = {}): SimNode {
  return {
    slug: 'test',
    title: 'Test',
    tags: [],
    agent: null,
    radius: 8,
    degree: 0,
    nodeType: 'default',
    opacity: 1,
    targetOpacity: 1,
    glowIntensity: 0.5,
    targetGlowIntensity: 0.5,
    x: 0,
    y: 0,
    ...overrides,
  };
}

describe('camera transforms', () => {
  it('worldToScreen returns canvas center for camera origin at scale 1', () => {
    const cam = createCamera();
    const [sx, sy] = worldToScreen(cam, 0, 0, 800, 600);
    expect(sx).toBe(400);
    expect(sy).toBe(300);
  });

  it('worldToScreen applies offset and scale', () => {
    const cam = createCamera();
    cam.x = 100;
    cam.y = 50;
    cam.scale = 2;
    const [sx, sy] = worldToScreen(cam, 100, 50, 800, 600);
    // World (100,50) - cam (100,50) = (0,0) * 2 + (400,300) = (400,300)
    expect(sx).toBe(400);
    expect(sy).toBe(300);
  });

  it('screenToWorld is inverse of worldToScreen', () => {
    const cam = createCamera();
    cam.x = 37;
    cam.y = -12;
    cam.scale = 1.5;

    const wx = 42, wy = -99;
    const [sx, sy] = worldToScreen(cam, wx, wy, 800, 600);
    const [rwx, rwy] = screenToWorld(cam, sx, sy, 800, 600);

    expect(rwx).toBeCloseTo(wx, 8);
    expect(rwy).toBeCloseTo(wy, 8);
  });

  it('roundtrip at various scales', () => {
    const cam = createCamera();
    for (const scale of [0.1, 0.5, 1, 2, 5]) {
      cam.scale = scale;
      cam.targetScale = scale;
      const [sx, sy] = worldToScreen(cam, 55, -33, 1000, 800);
      const [wx, wy] = screenToWorld(cam, sx, sy, 1000, 800);
      expect(wx).toBeCloseTo(55, 6);
      expect(wy).toBeCloseTo(-33, 6);
    }
  });
});

describe('zoomAtPoint', () => {
  it('keeps world point under cursor stationary', () => {
    const cam = createCamera();
    cam.targetScale = 1;
    cam.targetX = 0;
    cam.targetY = 0;

    const screenX = 600; // off-center cursor
    const screenY = 200;
    const W = 800, H = 600;

    // World point under cursor before zoom
    const [wxBefore, wyBefore] = screenToWorld(cam, screenX, screenY, W, H);

    zoomAtPoint(cam, screenX, screenY, -100, W, H); // zoom in

    // After applying target as current
    cam.x = cam.targetX;
    cam.y = cam.targetY;
    cam.scale = cam.targetScale;

    const [wxAfter, wyAfter] = screenToWorld(cam, screenX, screenY, W, H);

    expect(wxAfter).toBeCloseTo(wxBefore, 2);
    expect(wyAfter).toBeCloseTo(wyBefore, 2);
  });
});

describe('pan', () => {
  it('moves camera target', () => {
    const cam = createCamera();
    const before = cam.targetX;
    pan(cam, 50, 0);
    expect(cam.targetX).toBeLessThan(before);
  });
});

describe('lerpCamera', () => {
  it('moves current toward target', () => {
    const cam = createCamera();
    cam.targetX = 100;
    cam.targetY = -50;
    cam.targetScale = 2;

    lerpCamera(cam);

    expect(cam.x).toBeGreaterThan(0);
    expect(cam.y).toBeLessThan(0);
    expect(cam.scale).toBeGreaterThan(1);
  });

  it('snaps when close enough', () => {
    const cam = createCamera();
    cam.targetX = 0.001;
    cam.targetY = 0;
    cam.targetScale = 1;

    // Run enough iterations to converge
    for (let i = 0; i < 200; i++) lerpCamera(cam);

    expect(cam.x).toBe(cam.targetX);
    expect(cam.scale).toBe(cam.targetScale);
  });

  it('returns false when converged', () => {
    const cam = createCamera();
    // Already at target
    const moving = lerpCamera(cam);
    expect(moving).toBe(false);
  });
});

describe('fitToNodes', () => {
  it('centers camera on node bounding box', () => {
    const cam = createCamera();
    const nodes = [
      makeNode({ x: -100, y: -50 }),
      makeNode({ x: 100, y: 50 }),
    ];

    fitToNodes(cam, nodes, 800, 600);

    // Center should be at (0, 0) since nodes are symmetric
    expect(cam.targetX).toBeCloseTo(0, 0);
    expect(cam.targetY).toBeCloseTo(0, 0);
  });

  it('does nothing for empty node array', () => {
    const cam = createCamera();
    const before = { ...cam };
    fitToNodes(cam, [], 800, 600);
    expect(cam.targetX).toBe(before.targetX);
  });
});

describe('zoomToPoint', () => {
  it('sets target position and scale', () => {
    const cam = createCamera();
    zoomToPoint(cam, 42, -17, 2.5);
    expect(cam.targetX).toBe(42);
    expect(cam.targetY).toBe(-17);
    expect(cam.targetScale).toBe(2.5);
  });
});

describe('applyInertia', () => {
  it('decays velocity', () => {
    const cam = createCamera();
    cam.vx = 10;
    cam.vy = 5;
    const moving = applyInertia(cam);
    expect(moving).toBe(true);
    expect(Math.abs(cam.vx)).toBeLessThan(10);
  });

  it('stops when velocity is small', () => {
    const cam = createCamera();
    cam.vx = 0.1;
    cam.vy = 0.1;
    const moving = applyInertia(cam);
    expect(moving).toBe(false);
    expect(cam.vx).toBe(0);
  });
});
