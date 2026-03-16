/**
 * Graph visualization constants.
 *
 * All tuning values in one place — physics, glow, LOD thresholds, colors.
 */

// ─── Camera ──────────────────────────────────────────────────

export const CAMERA_MIN_SCALE = 0.08;
export const CAMERA_MAX_SCALE = 5;
export const CAMERA_ZOOM_FACTOR = 0.002;
export const CAMERA_LERP_SPEED = 0.12;
export const CAMERA_INERTIA_DECAY = 0.92;
export const CAMERA_INERTIA_MIN = 0.5;

// ─── LOD thresholds ──────────────────────────────────────────

export const LOD_POINTS_MAX = 0.3;
export const LOD_CIRCLES_MAX = 0.7;
export const LOD_LABELS_MAX = 1.5;
// scale >= LOD_LABELS_MAX → "full"

/** Min degree for label display at LOD "labels" level */
export const LOD_LABEL_MIN_DEGREE = 2;

// ─── Simulation / Physics ────────────────────────────────────

export const SIM_LINK_DISTANCE = 90;
export const SIM_LINK_STRENGTH = 0.35;
export const SIM_CHARGE_STRENGTH = -180;
export const SIM_COLLIDE_PADDING = 8;
export const SIM_ALPHA_DECAY = 0.018;
export const SIM_ALPHA_MIN = 0.001;
export const SIM_WARMUP_TICKS = 100;
export const SIM_POSITION_STRENGTH = 0.04;

// ─── Rendering ───────────────────────────────────────────────

export const NODE_MIN_RADIUS = 5;
export const NODE_MAX_RADIUS = 16;
export const NODE_RADIUS_BASE = 4;
export const NODE_RADIUS_PER_DEGREE = 1.5;

export const EDGE_ALPHA_GHOST = 0.04;
export const EDGE_ALPHA_NORMAL = 0.12;
export const EDGE_ALPHA_HIGHLIGHT = 0.6;

export const GLOW_BLUR_BASE = 12;
export const GLOW_BLUR_HIGH = 24;
export const GLOW_HALO_RADIUS_MULT = 2.5;

export const LABEL_FONT_SIZE = 11;
export const LABEL_FONT_WEIGHT = '500';
export const LABEL_MAX_WIDTH = 120;
export const LABEL_OFFSET_Y = 8;

// ─── Background stars ────────────────────────────────────────

export const BG_STAR_COUNT = 200;
export const BG_STAR_PARALLAX = 0.1;
export const BG_STAR_MIN_SIZE = 0.5;
export const BG_STAR_MAX_SIZE = 1.8;
export const BG_STAR_TWINKLE_AMP = 0.3;

// ─── Neighborhood / Focus ────────────────────────────────────

export const FOCUS_MAX_DEPTH = 4;
export const FOCUS_DEFAULT_DEPTH = 2;
export const DEPTH_OPACITY: Record<number, number> = {
  0: 1.0,
  1: 1.0,
  2: 0.35,
  3: 0.08,
};
export const FOCUS_BG_OPACITY = 0.06;
export const OPACITY_LERP_SPEED = 0.08;

// ─── Search ──────────────────────────────────────────────────

export const SEARCH_DEBOUNCE_MS = 150;
export const SEARCH_GHOST_OPACITY = 0.08;

// ─── Node type colors (hue shifts from accent) ──────────────

export const NODE_COLORS = {
  default: null, // uses accent
  devlog: 'oklch(0.65 0.12 240)',   // blue-tint
  lesson: 'oklch(0.72 0.15 70)',    // warm amber
  concept: null, // uses accent (violet in dark)
} as const;

export const NODE_COLORS_LIGHT = {
  default: null,
  devlog: 'oklch(0.50 0.10 240)',
  lesson: 'oklch(0.55 0.13 70)',
  concept: null,
} as const;

// ─── Interaction ─────────────────────────────────────────────

export const DOUBLE_CLICK_MS = 350;
export const DRAG_THRESHOLD_PX = 4;
export const NODE_HIT_PADDING = 4;

// ─── Animation ───────────────────────────────────────────────

export const IDLE_TIMEOUT_MS = 2000;
