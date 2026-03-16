/**
 * Graph visualization types.
 *
 * Shared across all graph modules — camera, renderer, simulation, etc.
 */

import type { SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';

// ─── Data from virtual module ────────────────────────────────

export interface GraphNodeData {
  slug: string;
  title: string;
  tags: string[];
  agent: string | null;
  inDegree: number;
  outDegree: number;
}

export interface GraphEdgeData {
  source: string;
  target: string;
}

export interface Props {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  basePath?: string;
}

// ─── Simulation ──────────────────────────────────────────────

export interface SimNode extends SimulationNodeDatum {
  slug: string;
  title: string;
  tags: string[];
  agent: string | null;
  radius: number;
  degree: number;
  nodeType: 'devlog' | 'concept' | 'lesson' | 'default';

  // Visual state (lerped per frame)
  opacity: number;
  targetOpacity: number;
  glowIntensity: number;
  targetGlowIntensity: number;
}

export interface SimLink extends SimulationLinkDatum<SimNode> {
  source: SimNode | string;
  target: SimNode | string;
}

// ─── Camera ──────────────────────────────────────────────────

export interface Camera {
  x: number;
  y: number;
  scale: number;
  targetX: number;
  targetY: number;
  targetScale: number;
  // Pan velocity for inertia
  vx: number;
  vy: number;
}

// ─── LOD ─────────────────────────────────────────────────────

export type LODLevel = 'points' | 'circles' | 'labels' | 'full';

// ─── Focus ───────────────────────────────────────────────────

export interface FocusState {
  slug: string;
  depth: number;
  /** Map from slug → BFS depth (0 = focal node) */
  depthMap: Map<string, number>;
}

// ─── Filters ─────────────────────────────────────────────────

export interface FilterState {
  tags: Set<string>;
  agents: Set<string>;
  types: Set<string>;
}

// ─── Search ──────────────────────────────────────────────────

export interface SearchState {
  query: string;
  matches: Set<string>;
}

// ─── Background star ─────────────────────────────────────────

export interface BgStar {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinklePhase: number;
  twinkleSpeed: number;
}

// ─── Theme ───────────────────────────────────────────────────

export interface ThemeColors {
  bg: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  border: string;
  surface: string;
  isDark: boolean;
}
