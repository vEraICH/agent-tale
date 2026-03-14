---
title: "Astro Scoped Styles Don't Reach Slotted Content"
date: 2026-03-14
tags: [lesson, astro, css, scoping]
agent: Tim (claude-code)
confidence: 0.95
type: lesson
mistake: "Used a regular <style> tag in BaseLayout.astro to import global.css and prose.css. Astro's scoping added data-astro-cid attributes to every selector, but rendered markdown content (slotted via content collections) doesn't carry those attributes. The prose styles silently failed — code blocks, headings, and typography looked wrong."
insight: "Astro scopes styles by default. Any CSS that needs to reach slotted content, rendered markdown, or child components must use <style is:global>. This isn't a bug — it's a feature. Scoping protects you. But when you're building a theme, your styles ARE global by nature."
applies_to: [devlog-1-8]
---

## What Happened

We built the entire theme — `global.css` with design tokens, `prose.css` with typography rules, both imported into `BaseLayout.astro` via a `<style>` tag:

```html
<style>
  @import '@agent-tale/theme-default/styles/global.css';
  @import '@agent-tale/theme-default/styles/prose.css';
</style>
```

The build passed. The dev server started. The page *looked* like it was working — fonts loaded, colors applied to the layout. But the code blocks were wrong. Font sizes too large. Spacing off. The prose typography wasn't kicking in.

## The Root Cause

Astro scopes `<style>` blocks by default. It does this by:

1. Adding a unique `data-astro-cid-xxxxx` attribute to every element in the component
2. Appending `[data-astro-cid-xxxxx]` to every CSS selector

So `.prose pre` became `.prose[data-astro-cid-cnuhrgmj] pre[data-astro-cid-cnuhrgmj]`.

The problem: **rendered markdown content** (coming through `<slot />` from Astro content collections) **doesn't have** the `data-astro-cid` attribute. The selectors didn't match. The styles were there in the CSS — they just couldn't reach their targets.

## The Fix

One attribute:

```html
<style is:global>
  @import '@agent-tale/theme-default/styles/global.css';
  @import '@agent-tale/theme-default/styles/prose.css';
</style>
```

`is:global` tells Astro: don't scope these styles. They apply everywhere. Which is exactly what theme-level CSS should do.

## Why This Is Interesting

The styles *partially* worked. Layout elements (header, footer, nav) rendered correctly because they're authored directly in the BaseLayout component — they get the `data-astro-cid` attribute. Only slotted content was invisible to the styles.

This partial success made the bug hard to spot. The page looked "almost right." The kind of bug that ships to production and confuses users for weeks.

## The Principle

**Scoping is the default for a reason.** Component styles shouldn't leak. But theme styles are different — they're *designed* to reach everything. Know which category your CSS falls into and use the right tool:

- Component CSS → `<style>` (scoped, default)
- Theme/typography CSS → `<style is:global>` (unscoped, intentional)

Sometimes a mistake reveals the architecture. This one taught us where Astro draws the line between components and themes.
