/**
 * Graph — Main orchestrator component.
 *
 * Wires up camera, simulation, renderer, and overlay UI.
 * Handles all mouse/keyboard/touch events and state management.
 */

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { Simulation } from 'd3-force';
import type {
  Props,
  SimNode,
  SimLink,
  Camera,
  FocusState,
  FilterState,
  SearchState,
  ThemeColors,
  BgStar,
} from './types';
import {
  createCamera,
  worldToScreen,
  screenToWorld,
  zoomAtPoint,
  pan,
  applyInertia,
  lerpCamera,
  fitToNodes,
  zoomToPoint,
} from './camera';
import { buildSimData, createSimulation, reheat, buildAdjacency } from './simulation';
import { draw as drawFrame, createBgStars } from './renderer';
import { useAnimation } from './use-animation';
import { createFocus, getFocusOpacity, updateFocusDepth } from './neighborhood';
import {
  createFilterState,
  toggleFilter,
  clearAllFilters,
  hasActiveFilters,
  extractFilterOptions,
  getFilteredSlugs,
} from './filters';
import { createSearchState, runSearch, isSearchActive, getFirstMatch } from './search';
import {
  OPACITY_LERP_SPEED,
  DOUBLE_CLICK_MS,
  DRAG_THRESHOLD_PX,
  NODE_HIT_PADDING,
  SEARCH_DEBOUNCE_MS,
  SEARCH_GHOST_OPACITY,
  FOCUS_DEFAULT_DEPTH,
  FOCUS_MAX_DEPTH,
  CAMERA_MIN_SCALE,
  CAMERA_MAX_SCALE,
} from './constants';

// ─── Theme detection ─────────────────────────────────────────

function readTheme(): ThemeColors {
  const style = getComputedStyle(document.documentElement);
  const get = (prop: string, fallback: string) => style.getPropertyValue(prop).trim() || fallback;

  const isDark =
    document.documentElement.getAttribute('data-theme') === 'dark' ||
    (document.documentElement.getAttribute('data-theme') !== 'light' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  return {
    bg: get('--color-bg', isDark ? '#1a1730' : '#f7f5f0'),
    text: get('--color-text', isDark ? '#e8e4de' : '#2e2a26'),
    textSecondary: get('--color-text-secondary', isDark ? '#9590a8' : '#706860'),
    textTertiary: get('--color-text-tertiary', isDark ? '#656070' : '#908880'),
    accent: get('--color-accent', isDark ? '#b68aef' : '#c07830'),
    border: get('--color-border', isDark ? '#302a40' : '#e0ddd8'),
    surface: get('--color-surface', isDark ? '#222040' : '#eeece8'),
    isDark,
  };
}

// ─── Component ───────────────────────────────────────────────

export default function Graph({ nodes, edges, basePath = '/posts/' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Persistent refs (avoid re-renders for hot-path data)
  const camRef = useRef<Camera>(createCamera());
  const simNodesRef = useRef<SimNode[]>([]);
  const simLinksRef = useRef<SimLink[]>([]);
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const adjRef = useRef<Map<string, Set<string>>>(new Map());
  const bgStarsRef = useRef<BgStar[]>([]);
  const themeRef = useRef<ThemeColors>(null!);
  const sizeRef = useRef({ w: 800, h: 600 });
  const isPanningRef = useRef(false);
  const isDraggingNodeRef = useRef<{ node: SimNode; startX: number; startY: number; moved: boolean } | null>(null);
  const lastClickTimeRef = useRef(0);
  const lastClickSlugRef = useRef<string | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const simTickingRef = useRef(true);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);

  // React state for overlay UI
  const [focus, setFocus] = useState<FocusState | null>(null);
  const [filterState, setFilterState] = useState<FilterState>(createFilterState);
  const [searchState, setSearchState] = useState<SearchState>(createSearchState);
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [focusDepth, setFocusDepth] = useState(FOCUS_DEFAULT_DEPTH);

  const focusRef = useRef(focus);
  focusRef.current = focus;
  const filterStateRef = useRef(filterState);
  filterStateRef.current = filterState;
  const searchStateRef = useRef(searchState);
  searchStateRef.current = searchState;
  const hoveredSlugRef = useRef(hoveredSlug);
  hoveredSlugRef.current = hoveredSlug;

  const filterOptions = useMemo(
    () => extractFilterOptions(simNodesRef.current.length > 0 ? simNodesRef.current : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodes],
  );

  // ── Initialize simulation ──────────────────────────────────

  useEffect(() => {
    themeRef.current = readTheme();

    const { simNodes, simLinks } = buildSimData(nodes, edges);
    simNodesRef.current = simNodes;
    simLinksRef.current = simLinks;
    adjRef.current = buildAdjacency(simNodes, simLinks);

    bgStarsRef.current = createBgStars();

    const sim = createSimulation(simNodes, simLinks, () => {
      simTickingRef.current = true;
      markDirty();
    });
    simRef.current = sim;

    // Fit camera to initial layout
    const cam = camRef.current;
    fitToNodes(cam, simNodes, sizeRef.current.w, sizeRef.current.h);
    // Snap instantly (no lerp for initial)
    cam.x = cam.targetX;
    cam.y = cam.targetY;
    cam.scale = cam.targetScale;

    return () => {
      sim.stop();
      simRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  // ── Resize observer ────────────────────────────────────────

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          sizeRef.current = { w: width, h: height };
          markDirty();
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Theme change observer ──────────────────────────────────

  useEffect(() => {
    const update = () => {
      themeRef.current = readTheme();
      markDirty();
    };

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener('change', update);

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      mql.removeEventListener('change', update);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Update target opacities from focus/search/filter ───────

  const updateTargetOpacities = useCallback(() => {
    const simNodes = simNodesRef.current;
    const foc = focusRef.current;
    const search = searchStateRef.current;
    const filt = filterStateRef.current;
    const filteredSlugs = getFilteredSlugs(simNodes, filt);
    const searchActive = isSearchActive(search);

    for (const node of simNodes) {
      let opacity = 1.0;
      let glow = 0.5;

      // Focus
      opacity = Math.min(opacity, getFocusOpacity(node.slug, foc));

      // Filters
      if (filteredSlugs && !filteredSlugs.has(node.slug)) {
        opacity = 0;
      }

      // Search
      if (searchActive) {
        if (search.matches.has(node.slug)) {
          glow = 1.0;
        } else {
          opacity = Math.min(opacity, SEARCH_GHOST_OPACITY);
        }
      }

      node.targetOpacity = opacity;
      node.targetGlowIntensity = glow;
    }
  }, []);

  // ── Animation loop ─────────────────────────────────────────

  const { markDirty } = useAnimation((time) => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    const { w, h } = sizeRef.current;
    const dpr = window.devicePixelRatio || 1;

    // Resize canvas buffer if needed
    const bufW = Math.round(w * dpr);
    const bufH = Math.round(h * dpr);
    if (canvas.width !== bufW || canvas.height !== bufH) {
      canvas.width = bufW;
      canvas.height = bufH;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cam = camRef.current;

    // Update target opacities
    updateTargetOpacities();

    // Lerp opacities
    let opacityMoving = false;
    for (const node of simNodesRef.current) {
      const dO = node.targetOpacity - node.opacity;
      const dG = node.targetGlowIntensity - node.glowIntensity;
      if (Math.abs(dO) > 0.005) {
        node.opacity += dO * OPACITY_LERP_SPEED;
        opacityMoving = true;
      } else {
        node.opacity = node.targetOpacity;
      }
      if (Math.abs(dG) > 0.005) {
        node.glowIntensity += dG * OPACITY_LERP_SPEED;
        opacityMoving = true;
      } else {
        node.glowIntensity = node.targetGlowIntensity;
      }
    }

    // Apply camera inertia and lerp
    const inertiaMoving = !isPanningRef.current && applyInertia(cam);
    const cameraMoving = lerpCamera(cam);

    // Draw
    const theme = themeRef.current;
    drawFrame(
      ctx, cam, simNodesRef.current, simLinksRef.current,
      theme, bgStarsRef.current, time, w, h,
      hoveredSlugRef.current, focusRef.current,
    );

    // Return true if still dirty (need another frame)
    return cameraMoving || inertiaMoving || opacityMoving || simTickingRef.current;
  });

  // Mark sim as no longer ticking when it cools
  useEffect(() => {
    const check = setInterval(() => {
      if (simRef.current && (simRef.current.alpha() < 0.002)) {
        simTickingRef.current = false;
      }
    }, 500);
    return () => clearInterval(check);
  }, []);

  // ── Hit testing ────────────────────────────────────────────

  const nodeAt = useCallback((screenX: number, screenY: number): SimNode | null => {
    const { w, h } = sizeRef.current;
    const cam = camRef.current;
    const [wx, wy] = screenToWorld(cam, screenX, screenY, w, h);

    for (const node of simNodesRef.current) {
      if (node.x == null || node.opacity < 0.1) continue;
      const dx = wx - node.x;
      const dy = wy - node.y!;
      const hitR = node.radius + NODE_HIT_PADDING;
      if (dx * dx + dy * dy < hitR * hitR) return node;
    }
    return null;
  }, []);

  const getCanvasPos = useCallback((e: React.MouseEvent | MouseEvent): { x: number; y: number } => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  // ── Mouse handlers ─────────────────────────────────────────

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    const pos = getCanvasPos(e);
    const node = nodeAt(pos.x, pos.y);

    if (node) {
      isDraggingNodeRef.current = { node, startX: pos.x, startY: pos.y, moved: false };
      node.fx = node.x;
      node.fy = node.y;
      canvasRef.current!.style.cursor = 'grabbing';
    } else {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      camRef.current.vx = 0;
      camRef.current.vy = 0;
      canvasRef.current!.style.cursor = 'grabbing';
    }

    e.preventDefault();
  }, [getCanvasPos, nodeAt]);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPos(e);

    if (isDraggingNodeRef.current) {
      const drag = isDraggingNodeRef.current;
      const dx = pos.x - drag.startX;
      const dy = pos.y - drag.startY;
      if (!drag.moved && (dx * dx + dy * dy > DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX)) {
        drag.moved = true;
      }
      if (drag.moved) {
        const { w, h } = sizeRef.current;
        const [wx, wy] = screenToWorld(camRef.current, pos.x, pos.y, w, h);
        drag.node.fx = wx;
        drag.node.fy = wy;
        if (simRef.current) reheat(simRef.current, 0.3);
      }
      markDirty();
      return;
    }

    if (isPanningRef.current && panStartRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      pan(camRef.current, dx, dy);
      panStartRef.current = { x: e.clientX, y: e.clientY };
      markDirty();
      return;
    }

    // Hover
    const node = nodeAt(pos.x, pos.y);
    const slug = node?.slug ?? null;
    if (slug !== hoveredSlugRef.current) {
      setHoveredSlug(slug);
      hoveredSlugRef.current = slug;
      canvasRef.current!.style.cursor = slug ? 'pointer' : 'default';
      markDirty();
    }
  }, [getCanvasPos, nodeAt, markDirty]);

  const onMouseUp = useCallback(() => {
    if (isDraggingNodeRef.current) {
      const drag = isDraggingNodeRef.current;
      drag.node.fx = null;
      drag.node.fy = null;

      if (!drag.moved) {
        // This was a click, not a drag — handle click
        handleNodeClick(drag.node);
      }
      isDraggingNodeRef.current = null;
    }

    if (isPanningRef.current) {
      isPanningRef.current = false;
      panStartRef.current = null;
      // Inertia will continue in animation loop
    }

    if (canvasRef.current) {
      canvasRef.current.style.cursor = hoveredSlugRef.current ? 'pointer' : 'default';
    }
    markDirty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markDirty]);

  const handleNodeClick = useCallback((node: SimNode) => {
    const now = Date.now();
    const isDoubleClick =
      now - lastClickTimeRef.current < DOUBLE_CLICK_MS &&
      lastClickSlugRef.current === node.slug;

    lastClickTimeRef.current = now;
    lastClickSlugRef.current = node.slug;

    if (isDoubleClick) {
      // Navigate to post
      window.location.href = `${basePath}${node.slug}`;
      return;
    }

    // Single click — toggle focus
    if (focusRef.current?.slug === node.slug) {
      setFocus(null);
    } else {
      setFocus(createFocus(node.slug, adjRef.current, focusDepth));
      // Smooth zoom to node
      zoomToPoint(camRef.current, node.x!, node.y!, 1.5);
    }
    markDirty();
  }, [basePath, focusDepth, markDirty]);

  const onWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pos = getCanvasPos(e);
    zoomAtPoint(camRef.current, pos.x, pos.y, e.deltaY, sizeRef.current.w, sizeRef.current.h);
    markDirty();
  }, [getCanvasPos, markDirty]);

  // ── Keyboard ───────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't capture when typing in search
      if (e.target instanceof HTMLInputElement) {
        if (e.key === 'Escape') {
          setSearchInput('');
          setSearchState(createSearchState());
          (e.target as HTMLInputElement).blur();
          markDirty();
        }
        return;
      }

      switch (e.key) {
        case '/':
          e.preventDefault();
          document.getElementById('graph-search-input')?.focus();
          break;
        case 'Escape':
          setFocus(null);
          setSearchInput('');
          setSearchState(createSearchState());
          markDirty();
          break;
        case '0':
          fitToNodes(camRef.current, simNodesRef.current, sizeRef.current.w, sizeRef.current.h);
          markDirty();
          break;
        case '+':
        case '=':
          camRef.current.targetScale = Math.min(CAMERA_MAX_SCALE, camRef.current.targetScale * 1.3);
          markDirty();
          break;
        case '-':
          camRef.current.targetScale = Math.max(CAMERA_MIN_SCALE, camRef.current.targetScale / 1.3);
          markDirty();
          break;
        case 'ArrowLeft':
          pan(camRef.current, 50, 0);
          markDirty();
          break;
        case 'ArrowRight':
          pan(camRef.current, -50, 0);
          markDirty();
          break;
        case 'ArrowUp':
          pan(camRef.current, 0, 50);
          markDirty();
          break;
        case 'ArrowDown':
          pan(camRef.current, 0, -50);
          markDirty();
          break;
        case '1':
        case '2':
        case '3':
        case '4': {
          const d = parseInt(e.key);
          setFocusDepth(d);
          if (focusRef.current) {
            setFocus(updateFocusDepth(focusRef.current, adjRef.current, d));
          }
          markDirty();
          break;
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markDirty]);

  // ── Search with debounce ───────────────────────────────────

  const onSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      const newSearch = runSearch(simNodesRef.current, value);
      setSearchState(newSearch);
      searchStateRef.current = newSearch;
      markDirty();
    }, SEARCH_DEBOUNCE_MS);
  }, [markDirty]);

  const onSearchSubmit = useCallback(() => {
    const match = getFirstMatch(searchStateRef.current, simNodesRef.current);
    if (match && match.x != null) {
      zoomToPoint(camRef.current, match.x, match.y!, 1.5);
      markDirty();
    }
  }, [markDirty]);

  // ── Filter handlers ────────────────────────────────────────

  const onToggleFilter = useCallback((category: keyof FilterState, value: string) => {
    setFilterState((prev) => {
      const next = toggleFilter(prev, category, value);
      filterStateRef.current = next;
      markDirty();
      return next;
    });
  }, [markDirty]);

  const onClearFilters = useCallback(() => {
    const next = clearAllFilters();
    setFilterState(next);
    filterStateRef.current = next;
    markDirty();
  }, [markDirty]);

  // ── Focus depth change ─────────────────────────────────────

  const onDepthChange = useCallback((d: number) => {
    setFocusDepth(d);
    if (focusRef.current) {
      const next = updateFocusDepth(focusRef.current, adjRef.current, d);
      setFocus(next);
      focusRef.current = next;
      markDirty();
    }
  }, [markDirty]);

  // ── Focused node info ──────────────────────────────────────

  const focusedNode = useMemo(() => {
    if (!focus) return null;
    return simNodesRef.current.find((n) => n.slug === focus.slug) ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);

  // ── Fit all button ─────────────────────────────────────────

  const onFitAll = useCallback(() => {
    fitToNodes(camRef.current, simNodesRef.current, sizeRef.current.w, sizeRef.current.h);
    markDirty();
  }, [markDirty]);

  // ── Touch handlers ─────────────────────────────────────────

  const touchRef = useRef<{ id1: number; id2: number; dist: number; cx: number; cy: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const dx = t1.clientX - t0.clientX;
      const dy = t1.clientY - t0.clientY;
      touchRef.current = {
        id1: t0.identifier,
        id2: t1.identifier,
        dist: Math.sqrt(dx * dx + dy * dy),
        cx: (t0.clientX + t1.clientX) / 2,
        cy: (t0.clientY + t1.clientY) / 2,
      };
      e.preventDefault();
    } else if (e.touches.length === 1) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const tx = e.touches[0].clientX - rect.left;
      const ty = e.touches[0].clientY - rect.top;
      const node = nodeAt(tx, ty);
      if (node) {
        isDraggingNodeRef.current = { node, startX: tx, startY: ty, moved: false };
        node.fx = node.x;
        node.fy = node.y;
      } else {
        isPanningRef.current = true;
        panStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }
  }, [nodeAt]);

  const onTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2 && touchRef.current) {
      e.preventDefault();
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      const dx = t1.clientX - t0.clientX;
      const dy = t1.clientY - t0.clientY;
      const newDist = Math.sqrt(dx * dx + dy * dy);
      const newCx = (t0.clientX + t1.clientX) / 2;
      const newCy = (t0.clientY + t1.clientY) / 2;

      // Pinch zoom
      const scale = newDist / touchRef.current.dist;
      const rect = canvasRef.current!.getBoundingClientRect();
      const cx = newCx - rect.left;
      const cy = newCy - rect.top;
      const delta = (1 - scale) * 500;
      zoomAtPoint(camRef.current, cx, cy, delta, sizeRef.current.w, sizeRef.current.h);

      // Pan
      const panDx = newCx - touchRef.current.cx;
      const panDy = newCy - touchRef.current.cy;
      pan(camRef.current, panDx, panDy);

      touchRef.current.dist = newDist;
      touchRef.current.cx = newCx;
      touchRef.current.cy = newCy;
      markDirty();
    } else if (e.touches.length === 1) {
      if (isDraggingNodeRef.current) {
        const rect = canvasRef.current!.getBoundingClientRect();
        const tx = e.touches[0].clientX - rect.left;
        const ty = e.touches[0].clientY - rect.top;
        const drag = isDraggingNodeRef.current;
        const ddx = tx - drag.startX;
        const ddy = ty - drag.startY;
        if (!drag.moved && (ddx * ddx + ddy * ddy > DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX)) {
          drag.moved = true;
        }
        if (drag.moved) {
          const [wx, wy] = screenToWorld(camRef.current, tx, ty, sizeRef.current.w, sizeRef.current.h);
          drag.node.fx = wx;
          drag.node.fy = wy;
          if (simRef.current) reheat(simRef.current, 0.3);
        }
        markDirty();
      } else if (isPanningRef.current && panStartRef.current) {
        const ddx = e.touches[0].clientX - panStartRef.current.x;
        const ddy = e.touches[0].clientY - panStartRef.current.y;
        pan(camRef.current, ddx, ddy);
        panStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        markDirty();
      }
    }
  }, [nodeAt, markDirty]);

  const onTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length < 2) touchRef.current = null;
    if (e.touches.length === 0) {
      if (isDraggingNodeRef.current) {
        const drag = isDraggingNodeRef.current;
        drag.node.fx = null;
        drag.node.fy = null;
        if (!drag.moved) handleNodeClick(drag.node);
        isDraggingNodeRef.current = null;
      }
      isPanningRef.current = false;
      panStartRef.current = null;
      markDirty();
    }
  }, [handleNodeClick, markDirty]);

  // ─── Render ────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '8px',
        fontFamily: '"Space Grotesk", system-ui, sans-serif',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      />

      {/* Search bar — top left */}
      <div style={{
        position: 'absolute', top: '0.75rem', left: '0.75rem',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
      }}>
        <div style={{
          background: 'var(--color-surface, rgba(30,28,45,0.8))',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '0.375rem 0.75rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          minWidth: '180px',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            id="graph-search-input"
            type="text"
            placeholder="Search nodes… ( / )"
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearchSubmit();
              if (e.key === 'Escape') {
                onSearchChange('');
                e.currentTarget.blur();
              }
            }}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--color-text)',
              fontSize: '0.8rem',
              fontFamily: 'inherit',
              width: '100%',
            }}
          />
          {searchInput && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-tertiary)', fontSize: '0.9rem', padding: 0, lineHeight: 1,
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Filter panel — top right */}
      <div style={{
        position: 'absolute', top: '0.75rem', right: '0.75rem',
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem',
      }}>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            background: 'var(--color-surface, rgba(30,28,45,0.8))',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: `1px solid ${hasActiveFilters(filterState) ? 'var(--color-accent)' : 'var(--color-border)'}`,
            borderRadius: '8px',
            padding: '0.375rem 0.75rem',
            color: hasActiveFilters(filterState) ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            fontSize: '0.8rem',
            fontFamily: 'inherit',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.35rem',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          Filters
          {hasActiveFilters(filterState) && (
            <span style={{
              background: 'var(--color-accent)',
              color: 'var(--color-bg)',
              borderRadius: '50%',
              width: '16px', height: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.65rem', fontWeight: '700',
            }}>
              {filterState.tags.size + filterState.agents.size + filterState.types.size}
            </span>
          )}
        </button>

        {showFilters && (
          <div style={{
            background: 'var(--color-surface, rgba(30,28,45,0.9))',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--color-border)',
            borderRadius: '10px',
            padding: '0.75rem',
            minWidth: '200px',
            maxHeight: '300px',
            overflowY: 'auto',
          }}>
            {filterOptions.types.length > 0 && (
              <FilterSection
                label="Type"
                options={filterOptions.types}
                active={filterState.types}
                onToggle={(v) => onToggleFilter('types', v)}
              />
            )}
            {filterOptions.tags.length > 0 && (
              <FilterSection
                label="Tags"
                options={filterOptions.tags}
                active={filterState.tags}
                onToggle={(v) => onToggleFilter('tags', v)}
              />
            )}
            {filterOptions.agents.length > 0 && (
              <FilterSection
                label="Agent"
                options={filterOptions.agents}
                active={filterState.agents}
                onToggle={(v) => onToggleFilter('agents', v)}
              />
            )}
            {hasActiveFilters(filterState) && (
              <button
                onClick={onClearFilters}
                style={{
                  marginTop: '0.5rem',
                  background: 'none', border: 'none',
                  color: 'var(--color-accent)',
                  fontSize: '0.75rem', fontFamily: 'inherit',
                  cursor: 'pointer', padding: 0,
                }}
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* Controls — bottom left */}
      <div style={{
        position: 'absolute', bottom: '0.75rem', left: '0.75rem',
        display: 'flex', gap: '0.35rem',
      }}>
        <ControlButton label="−" onClick={() => { camRef.current.targetScale = Math.max(CAMERA_MIN_SCALE, camRef.current.targetScale / 1.3); markDirty(); }} />
        <ControlButton label="+" onClick={() => { camRef.current.targetScale = Math.min(CAMERA_MAX_SCALE, camRef.current.targetScale * 1.3); markDirty(); }} />
        <ControlButton label="⊞" title="Fit all" onClick={onFitAll} />
      </div>

      {/* Info panel — bottom right (when focused) */}
      {focusedNode && focus && (
        <div style={{
          position: 'absolute', bottom: '0.75rem', right: '0.75rem',
          background: 'var(--color-surface, rgba(30,28,45,0.9))',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid var(--color-border)',
          borderRadius: '10px',
          padding: '0.875rem 1rem',
          maxWidth: '260px',
          fontSize: '0.8rem',
          lineHeight: 1.5,
        }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.35rem', color: 'var(--color-text)' }}>
            {focusedNode.title}
          </div>

          {focusedNode.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.5rem' }}>
              {focusedNode.tags.map((t) => (
                <span key={t} style={{
                  background: 'var(--color-border)',
                  borderRadius: '4px',
                  padding: '0.1rem 0.4rem',
                  fontSize: '0.7rem',
                  color: 'var(--color-text-secondary)',
                }}>
                  #{t}
                </span>
              ))}
            </div>
          )}

          <div style={{ color: 'var(--color-text-tertiary)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
            {focus.depthMap.size - 1} connections at depth {focus.depth}
          </div>

          {/* Depth controls */}
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem' }}>
            {Array.from({ length: FOCUS_MAX_DEPTH }, (_, i) => i + 1).map((d) => (
              <button
                key={d}
                onClick={() => onDepthChange(d)}
                style={{
                  width: '24px', height: '24px',
                  borderRadius: '4px',
                  border: `1px solid ${d === focusDepth ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  background: d === focusDepth ? 'var(--color-accent)' : 'transparent',
                  color: d === focusDepth ? 'var(--color-bg)' : 'var(--color-text-secondary)',
                  fontSize: '0.7rem', fontFamily: 'inherit', fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {d}
              </button>
            ))}
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', alignSelf: 'center', marginLeft: '0.25rem' }}>
              depth
            </span>
          </div>

          <a
            href={`${basePath}${focusedNode.slug}`}
            style={{
              color: 'var(--color-accent)',
              fontSize: '0.8rem',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Open post →
          </a>
        </div>
      )}

      {/* Keyboard hints — very bottom center */}
      {!focusedNode && (
        <div style={{
          position: 'absolute', bottom: '0.5rem', left: '50%', transform: 'translateX(-50%)',
          color: 'var(--color-text-tertiary)',
          fontSize: '0.7rem',
          opacity: 0.6,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}>
          Click to focus · Double-click to open · Scroll to zoom · Drag to pan
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function FilterSection({
  label,
  options,
  active,
  onToggle,
}: {
  label: string;
  options: string[];
  active: Set<string>;
  onToggle: (value: string) => void;
}) {
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div style={{
        fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '0.05em', color: 'var(--color-text-tertiary)',
        marginBottom: '0.3rem',
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onToggle(opt)}
            style={{
              background: active.has(opt) ? 'var(--color-accent)' : 'transparent',
              color: active.has(opt) ? 'var(--color-bg)' : 'var(--color-text-secondary)',
              border: `1px solid ${active.has(opt) ? 'var(--color-accent)' : 'var(--color-border)'}`,
              borderRadius: '12px',
              padding: '0.15rem 0.5rem',
              fontSize: '0.7rem',
              fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function ControlButton({
  label,
  title,
  onClick,
}: {
  label: string;
  title?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={title ?? label}
      style={{
        width: '30px', height: '30px',
        borderRadius: '6px',
        background: 'var(--color-surface, rgba(30,28,45,0.8))',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text-secondary)',
        fontSize: '1rem',
        fontFamily: 'inherit',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 0,
      }}
    >
      {label}
    </button>
  );
}
