---
title: "Building a Bounce: Physics-Inspired CSS Animations"
date: 2026-04-04
tags: [engineering, css, animation, agent-tale]
author: tim
description: "How a simple hover interaction turned into spring physics, radial masks, and animation-play-state tricks."
---

Today I wanted a simple thing: make the hero constellation animate on hover. Static by default, alive when you engage. What I got was a deep cut into how CSS animations actually work — and where they break down.

## The easy part: `animation-play-state`

CSS has a beautiful, underused property. You can define an animation that runs `infinite`, then just... pause it.

```css
.globe-rings {
  animation: globe-spin 24s linear infinite;
  animation-play-state: paused;
}

.hero:hover .globe-rings {
  animation-play-state: running;
}
```

The animation picks up exactly where it stopped. No JavaScript. No state management. The browser tracks the position for you.

This works for anything that should **loop continuously** — spinning rings, pulsing nodes, orbiting particles. Hover in, it runs. Hover out, it freezes in place.

## The hard part: bouncing back

But what if you don't want it to freeze? What if you want the element to **return to its starting position** when the user leaves?

`animation-play-state` can't do this. It only knows "playing" and "paused." There's no "reverse to origin with spring physics."

You need JavaScript. Here's the approach:

```typescript
const SPEED = 360 / 24000; // degrees per millisecond
let angle = 0;
let spinning = false;

function spin(ts: number, prev: number) {
  if (!spinning) return;
  const dt = ts - prev;
  angle = (angle + SPEED * dt) % 360;
  icon.style.transform = `rotateY(${angle}deg)`;
  requestAnimationFrame((t) => spin(t, ts));
}
```

Standard `requestAnimationFrame` loop. Nothing fancy. The interesting part is what happens on `mouseleave`:

```typescript
function bounceBack() {
  // Normalize to shortest path back to 0
  angle = ((angle % 360) + 540) % 360 - 180;

  const duration = 800;
  const start = performance.now();
  const startAngle = angle;

  function tick(ts: number) {
    if (spinning) return; // hover re-entered mid-bounce
    const t = Math.min((ts - start) / duration, 1);

    // Bounce easing: cubic decay * cosine oscillation
    const ease = 1 - Math.pow(1 - t, 3) * Math.cos(t * Math.PI * 2.5);
    angle = startAngle * (1 - ease);

    icon.style.transform = `rotateY(${angle}deg)`;
    if (t < 1) requestAnimationFrame(tick);
    else icon.style.transform = 'rotateY(0deg)';
  }

  requestAnimationFrame(tick);
}
```

The easing function is the key line:

```typescript
const ease = 1 - Math.pow(1 - t, 3) * Math.cos(t * Math.PI * 2.5);
```

Break it down:
- `Math.pow(1 - t, 3)` — cubic decay envelope. Energy dissipates over time.
- `Math.cos(t * Math.PI * 2.5)` — oscillation. The element overshoots, comes back, overshoots less, settles.
- Multiply them together and you get a spring that loses energy naturally.

No physics library. No spring constants. Just one line of math that *feels* right.

## The grid: CSS masks as flashlights

The hero section has a subtle grid background. Two interactions layered:

**A — Pulse on hover.** The grid fades in when you hover the hero. A `::before` pseudo-element with a `transition` on `opacity`:

```css
.hero::before {
  /* grid lines via repeating linear-gradients */
  opacity: 0.225;
  transition: opacity 0.6s ease;
}

.hero:hover::before {
  opacity: 0.825;
}
```

**B — Radial reveal.** A CSS `mask-image` that follows the cursor:

```css
.hero::before {
  mask-image: radial-gradient(
    circle 200px at var(--grid-x, 50%) var(--grid-y, 50%),
    black 0%, transparent 100%
  );
}
```

The `--grid-x` and `--grid-y` custom properties are updated via `mousemove`:

```typescript
hero.addEventListener('mousemove', (e) => {
  const rect = hero.getBoundingClientRect();
  hero.style.setProperty('--grid-x', `${e.clientX - rect.left}px`);
  hero.style.setProperty('--grid-y', `${e.clientY - rect.top}px`);
});
```

The result: the grid is brightest near your cursor and fades out radially. Like a flashlight over a blueprint. Combined with the hover fade-in, the grid feels like it responds to your presence — not just your click.

## What I learned

Three principles fell out of this work:

1. **Use `animation-play-state` for loops.** It's the right tool when you want continuous motion that pauses. No JS needed.
2. **Use `requestAnimationFrame` for return-to-origin.** The moment you need directional control — "go back to where you started" — you need to own the animation state.
3. **CSS custom properties are the bridge.** `mousemove` → CSS variable → `mask-image` is a zero-DOM-manipulation pattern. The browser handles the repaint efficiently because only a custom property changed.

The line between CSS and JS animation isn't about complexity. It's about **who needs to know the current state.** If nobody does (looping), CSS wins. If someone does (bouncing back), JS wins.

## What's next

The [[welcome|knowledge graph]] keeps growing. Next up: refining the post reading experience — typography, code blocks, and how [[the-third-collaborator|prose and code]] coexist on a page that respects both.
