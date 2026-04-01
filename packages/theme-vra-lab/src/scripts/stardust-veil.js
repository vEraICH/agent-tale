// ─────────────────────────────────────────────
// Stardust Veil — Dense shimmering cosmic stardust curtain
// Extracted from stardust-veil.html for use as a page background.
// ─────────────────────────────────────────────

const VERT_SRC = `attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }`;

const FRAG_SRC = `precision highp float;
uniform float u_time;
uniform vec2 u_res;
uniform float u_driftSpeed;
uniform float u_starDensity;
uniform vec2 u_mouse;

#define PI 3.14159265359
#define TAU 6.28318530718

// ══════════════════════════════════════════
// Hash & Noise primitives
// ══════════════════════════════════════════

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float hash1(float n) {
  return fract(sin(n) * 43758.5453123);
}

vec2 hash2(vec2 p) {
  return vec2(
    fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453),
    fract(sin(dot(p, vec2(269.5, 183.3))) * 43758.5453)
  );
}

// Smooth value noise
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// FBM — configurable octaves (up to 7)
float fbm(vec2 p, int octaves) {
  float val = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  for (int i = 0; i < 7; i++) {
    if (i >= octaves) break;
    val += amp * noise(p * freq);
    freq *= 2.03;
    amp *= 0.49;
    p += vec2(1.7, 9.2);
  }
  return val;
}

// Domain-warped FBM for organic nebula shapes (single warp, 3+3+4 octaves)
float warpedFbm(vec2 p, float t) {
  vec2 q = vec2(
    fbm(p + t * 0.02, 3),
    fbm(p + vec2(5.2, 1.3) + t * 0.015, 3)
  );
  return fbm(p + 3.0 * q, 4);
}

// ══════════════════════════════════════════
// Layer 1: Background Nebula
// ══════════════════════════════════════════

vec3 backgroundNebula(vec2 uv, float t) {
  vec2 p = uv * 1.8;
  float n1 = warpedFbm(p, t);

  vec3 deepPurple = vec3(0.06, 0.02, 0.10);
  vec3 midnightBlue = vec3(0.03, 0.03, 0.09);
  vec3 darkMauve = vec3(0.08, 0.03, 0.07);

  vec3 col = mix(deepPurple, midnightBlue, n1);
  col = mix(col, darkMauve, smoothstep(0.3, 0.7, n1) * 0.5);

  float bright = smoothstep(0.35, 0.65, n1) * 0.06;
  col += bright;

  return col;
}

// ══════════════════════════════════════════
// Layer 2: Aurora Ribbons
// ══════════════════════════════════════════

vec3 auroraRibbons(vec2 uv, float t) {
  vec3 col = vec3(0.0);
  float drift = u_driftSpeed;

  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float yOffset = -0.4 + fi * 0.25 + sin(fi * 1.7) * 0.1;

    vec2 warpP = uv * vec2(1.5, 2.0) + vec2(t * 0.03 * drift + fi * 3.0, fi * 2.7);
    float warpX = fbm(warpP, 3) * 0.4;
    float warpY = fbm(warpP + vec2(3.3, 7.7), 3) * 0.3;

    vec2 warped = vec2(uv.x + warpX, uv.y + warpY);

    float ribbonNoise = fbm(vec2(warped.x * 2.5 + t * 0.04 * drift, warped.y * 3.0 + yOffset) + fi * 5.0, 4);
    float ridged = 1.0 - abs(ribbonNoise * 2.0 - 1.0);
    ridged = pow(ridged, 4.0);

    float ribbonNoise2 = fbm(vec2(warped.x * 4.0 - t * 0.025 * drift, warped.y * 5.0 + yOffset * 1.5) + fi * 8.0, 3);
    float ridged2 = 1.0 - abs(ribbonNoise2 * 2.0 - 1.0);
    ridged2 = pow(ridged2, 5.0);

    float ribbon = ridged * 0.7 + ridged2 * 0.3;

    vec3 bandColor;
    if (i == 0) bandColor = vec3(0.55, 0.45, 0.80);
    else if (i == 1) bandColor = vec3(0.80, 0.50, 0.60);
    else if (i == 2) bandColor = vec3(0.85, 0.75, 0.50);
    else bandColor = vec3(0.70, 0.45, 0.70);

    float breath = 0.6 + 0.4 * sin(t * 0.08 + fi * 1.3);

    col += bandColor * ribbon * breath * 0.18;
  }

  return col;
}

// ══════════════════════════════════════════
// Layer 3–5: Star fields
// ══════════════════════════════════════════

float starLayer(vec2 uv, float scale, float threshold, float t, float speed, float seed) {
  vec2 p = uv * scale;
  p.y += t * speed * u_driftSpeed;
  p.x += t * speed * u_driftSpeed * 0.3 + sin(t * 0.05) * 0.2;

  vec2 cell = floor(p);
  vec2 f = fract(p);

  float stars = 0.0;

  for (int dy = -1; dy <= 1; dy++) {
    for (int dx = -1; dx <= 1; dx++) {
      vec2 neighbor = vec2(float(dx), float(dy));
      vec2 cellId = cell + neighbor;
      vec2 starCenter = hash2(cellId + seed);

      vec2 diff = neighbor + starCenter - f;
      float dist = length(diff);

      float present = step(threshold, hash(cellId * 0.7 + seed + 77.0));
      float brightness = hash(cellId * 1.3 + seed + 33.0);

      float twinklePhase = hash(cellId * 2.1 + seed + 99.0) * TAU;
      float twinkleSpeed = 0.8 + hash(cellId * 3.7 + seed + 55.0) * 2.0;
      float twinkle = 0.5 + 0.5 * sin(t * twinkleSpeed + twinklePhase);

      float starSize = 0.015 + brightness * 0.02;
      float core = smoothstep(starSize, starSize * 0.1, dist);
      float glow = exp(-dist * dist / (starSize * starSize * 4.0));

      stars += (core * 1.2 + glow * 0.4) * brightness * twinkle * present;
    }
  }

  return stars * u_starDensity;
}

// ══════════════════════════════════════════
// Layer 5: Star flares & halos
// ══════════════════════════════════════════

float starFlare(vec2 uv, float scale, float t, float seed) {
  vec2 p = uv * scale;
  p.y += t * 0.12 * u_driftSpeed;
  p.x += t * 0.04 * u_driftSpeed;

  vec2 cell = floor(p);
  vec2 f = fract(p);
  float flare = 0.0;

  for (int dy = -1; dy <= 1; dy++) {
    for (int dx = -1; dx <= 1; dx++) {
      vec2 neighbor = vec2(float(dx), float(dy));
      vec2 cellId = cell + neighbor;
      vec2 starCenter = hash2(cellId + seed);
      vec2 diff = neighbor + starCenter - f;
      float dist = length(diff);

      float isBright = step(0.82, hash(cellId * 1.3 + seed + 33.0));
      float present = step(0.7, hash(cellId * 0.7 + seed + 77.0));

      float flarePhase = hash(cellId * 4.1 + seed + 111.0) * TAU;
      float flareRate = 0.3 + hash(cellId * 5.3 + seed + 222.0) * 0.4;
      float flarePulse = pow(max(sin(t * flareRate + flarePhase), 0.0), 12.0);

      float haloSize = 0.08 + flarePulse * 0.06;
      float halo = exp(-dist * dist / (haloSize * haloSize));

      flare += halo * flarePulse * isBright * present;
    }
  }

  return flare * u_starDensity;
}

// ══════════════════════════════════════════
// Layer 6: Connecting threads
// ══════════════════════════════════════════

float connectingThreads(vec2 uv, float scale, float t, float seed) {
  vec2 p = uv * scale;
  p.y += t * 0.08 * u_driftSpeed;
  p.x += t * 0.025 * u_driftSpeed;

  vec2 cell = floor(p);
  vec2 f = fract(p);
  float threads = 0.0;

  for (int dy = -1; dy <= 1; dy++) {
    for (int dx = -1; dx <= 1; dx++) {
      vec2 neighbor = vec2(float(dx), float(dy));
      vec2 cellId = cell + neighbor;

      float present1 = step(0.6, hash(cellId * 0.7 + seed + 77.0));
      if (present1 < 0.5) continue;

      vec2 star1 = neighbor + hash2(cellId + seed) - f;

      for (int ny = -1; ny <= 1; ny++) {
        for (int nx = 0; nx <= 1; nx++) {
          if (nx == 0 && ny <= 0) continue;
          vec2 neighbor2 = neighbor + vec2(float(nx), float(ny));
          vec2 cellId2 = cell + neighbor2;

          float present2 = step(0.6, hash(cellId2 * 0.7 + seed + 77.0));
          if (present2 < 0.5) continue;

          vec2 star2 = neighbor2 + hash2(cellId2 + seed) - f;

          float starDist = length(star2 - star1);
          if (starDist > 1.5) continue;

          vec2 pa = -star1;
          vec2 ba = star2 - star1;
          float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
          float d = length(pa - ba * h);

          float curve = sin(h * PI + t * 0.3) * 0.015;
          d = abs(d - curve);

          float lineWidth = 0.008;
          float line = exp(-d * d / (lineWidth * lineWidth));

          float endFade = smoothstep(0.0, 0.15, h) * smoothstep(1.0, 0.85, h);

          threads += line * endFade * 0.3;
        }
      }
    }
  }

  return threads;
}

// ══════════════════════════════════════════
// Layer 7: Traveling brightness wave
// ══════════════════════════════════════════

float travelingWave(vec2 uv, float t) {
  float diag = uv.x * 0.7 + uv.y * 0.3;

  float wavePeriod = 5.0;
  float wavePos = fract(t / wavePeriod) * 3.0 - 1.0;

  float waveWidth = 0.35;
  float wave = exp(-(diag - wavePos) * (diag - wavePos) / (waveWidth * waveWidth));

  float wavePos2 = fract((t + 2.5) / (wavePeriod * 1.3)) * 3.0 - 1.0;
  float wave2 = exp(-(diag - wavePos2) * (diag - wavePos2) / (waveWidth * 1.5 * waveWidth * 1.5));

  return wave * 0.35 + wave2 * 0.2;
}

// ══════════════════════════════════════════
// Main composition
// ══════════════════════════════════════════

void main() {
  vec2 uv = (gl_FragCoord.xy - u_res * 0.5) / min(u_res.x, u_res.y);

  if (u_mouse.x > 0.0) {
    vec2 mUV = (u_mouse - u_res * 0.5) / min(u_res.x, u_res.y);
    vec2 delta = uv - mUV;
    float d = length(delta);
    float warpStrength = 0.08 / (d + 0.1);
    uv += delta * warpStrength;
  }

  float t = u_time;

  vec3 col = backgroundNebula(uv, t);

  vec3 aurora = auroraRibbons(uv, t);
  col += aurora;

  float farStars = starLayer(uv, 35.0, 0.35, t, 0.02, 0.0);
  vec3 farStarColor = vec3(0.65, 0.72, 0.90);
  col += farStarColor * farStars * 0.25;

  float midStars = starLayer(uv, 18.0, 0.45, t, 0.06, 100.0);
  vec3 midStarColor = vec3(0.80, 0.65, 0.85);
  col += midStarColor * midStars * 0.45;

  float nearStars = starLayer(uv, 8.0, 0.65, t, 0.12, 200.0);
  vec3 nearStarColor = vec3(0.90, 0.75, 0.60);
  col += nearStarColor * nearStars * 0.55;

  float flares = starFlare(uv, 8.0, t, 200.0);
  vec3 flareColor = vec3(1.0, 0.85, 0.70);
  col += flareColor * flares * 0.6;

  float threads = connectingThreads(uv, 8.0, t, 200.0);
  vec3 threadColor = vec3(0.60, 0.50, 0.75);
  col += threadColor * threads * 0.15;

  float threads2 = connectingThreads(uv, 18.0, t, 100.0);
  col += threadColor * threads2 * 0.08;

  float wave = travelingWave(uv, t);
  col *= 1.0 + wave;
  vec3 waveColor = vec3(0.70, 0.60, 0.85);
  col += waveColor * wave * 0.04;

  float shimmer = noise(uv * 12.0 + t * 0.5) * noise(uv * 8.0 - t * 0.3);
  col += vec3(0.75, 0.65, 0.85) * shimmer * 0.015;

  float dist = length(uv);
  float vignette = 1.0 - smoothstep(0.5, 1.4, dist);
  col *= 0.7 + vignette * 0.3;

  float grain = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + fract(t * 0.1) * 100.0) * 43758.5453) - 0.5) * 0.012;
  col += grain;

  col = max(col, vec3(0.0));
  col = col / (col + 0.85) * 1.15;

  col = pow(col, vec3(0.97, 1.0, 1.04));

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(s));
  }
  return s;
}

/**
 * Initialise the Stardust Veil WebGL shader on the given canvas.
 * @param {HTMLCanvasElement} canvas
 * @returns {{ destroy: () => void }}
 */
export function initStardustVeil(canvas) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: false });
  if (!gl) return { destroy() {} };

  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT_SRC));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(prog));
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uRes = gl.getUniformLocation(prog, 'u_res');
  const uDriftSpeed = gl.getUniformLocation(prog, 'u_driftSpeed');
  const uStarDensity = gl.getUniformLocation(prog, 'u_starDensity');
  const uMouse = gl.getUniformLocation(prog, 'u_mouse');

  const dpr = 1.0;
  let mouseX = -1.0, mouseY = -1.0;
  let needsResize = true;
  let running = true;

  // Canvas has pointer-events: none, so attach to window instead
  function onMouseMove(e) {
    mouseX = e.clientX * dpr;
    mouseY = (window.innerHeight - e.clientY) * dpr;
  }
  function onMouseLeave() { mouseX = -1.0; mouseY = -1.0; }
  window.addEventListener('mousemove', onMouseMove);
  document.documentElement.addEventListener('mouseleave', onMouseLeave);

  function resize() {
    needsResize = false;
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    }
  }

  function render(now) {
    if (!running) return;
    if (needsResize) resize();
    gl.uniform1f(uTime, prefersReduced ? 0.0 : now * 0.001);
    gl.uniform1f(uDriftSpeed, 0.4);
    gl.uniform1f(uStarDensity, 1.0);
    gl.uniform2f(uMouse, mouseX, mouseY);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    requestAnimationFrame(render);
  }

  function onResize() { needsResize = true; }
  function onVisibility() {
    if (document.hidden) {
      running = false;
    } else {
      running = true;
      requestAnimationFrame(render);
    }
  }

  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibility);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (!running) { running = true; requestAnimationFrame(render); }
      } else {
        running = false;
      }
    });
  }, { threshold: 0.1 });
  observer.observe(canvas);

  resize();
  requestAnimationFrame(render);

  return {
    destroy() {
      running = false;
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      document.documentElement.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    }
  };
}
