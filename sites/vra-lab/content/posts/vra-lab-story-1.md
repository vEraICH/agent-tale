---
title: "From Zero to Blog: How VRA Lab Got Built"
date: '2026-04-02'
description: 'The story of standing up a blog from scratch — why Astro, why markdown-first, and what we got wrong on the first try.'
tags:
  - meta
  - agent-tale
  - devlog
author: tim
series: "Building VRA Lab"
seriesOrder: 1
---

Every blog starts the same way. A blank directory, a framework decision, and a list of features you tell yourself you'll add "later."

VRA Lab started that way too. Except "later" turned out to be a few focused sessions with an AI agent — and the scope kept growing in ways I didn't expect.

Here's how it actually happened.

## The decision

I didn't want a blog. I wanted a *place* — somewhere to think in public, share what I'm building, and let the connections between ideas be visible. Not just a feed of posts sorted by date.

The obvious choice was one of the usual suspects: Ghost, Substack, a static site with a theme from someone else's GitHub. But all of them have the same problem. They're publication tools. You put things in, they come out the other end sorted by time. The structure underneath — the way ideas relate, the threads you keep pulling — that's invisible.

So I built on a markdown-first graph platform where every `[[wikilink]]` is a real edge in a content graph. That graph is the thing. The blog is just one way to see it.

## Standing up the bones

The first version was barebones. Astro, a content collection, a layout, some CSS variables for the VRA Lab palette. The design system had two things going for it: a warm amber accent for light mode and a cool violet for dark. Everything else was system fonts and spacing.

Getting that first post to render — the hello world draft — took one session. Getting it to *look right* took longer. Typography at the right scale. Code blocks with syntax highlighting that doesn't blind you in dark mode. The small things that make reading feel like reading.

Shiki dual-theme syntax highlighting was one of the early wins. Astro has first-class support for it — `markdown.shikiConfig.themes` with `light-plus` and a dark variant, both keyed to the `data-theme` attribute. One change, both modes sorted.

The copy-code button came next. It sounds like a micro-feature. It is. But try reading a dev blog without one and you'll notice every time you have to triple-click a terminal command.

## What we got wrong

The first attempt at a table of contents put it at the top of the post. Collapsible. It felt clever. It was bad.

Nobody reads a table of contents before they read the post. They scan it *during* — when they're lost or want to skip ahead. Sticky sidebar is the right answer. Show it only on long posts (3+ headings), only on wide viewports. It took a second pass to land there, but the principle was obvious once I thought about who actually uses a TOC and when.

The other thing we got wrong early: font choices. Tried two serif options before landing back on system fonts for body text. Serifs looked beautiful in screenshots. In actual reading, at actual sizes, on actual screens — the system stack is just better. Georgia is still there on the About page because that one *is* a book-page. But prose is prose.

## Where it stood after day one

By the end of the first serious build session, VRA Lab had:

- Posts rendering from markdown with frontmatter validation
- Light/dark theme toggle with OS preference detection  
- Shiki syntax highlighting in both themes
- Copy-code buttons
- Reading progress bar
- Table of contents (sticky, threshold-gated)
- RSS feed and sitemap
- A deploy pipeline to Railway from a release branch

Not bad. But it was still just a blog. The graph identity — the thing that makes VRA Lab not just another Astro site — that came later.

What came next was making it *legible* to the world. SEO, structured data, and something I didn't expect to care about: making the content readable by machines that aren't search crawlers. That's [[vra-lab-story-2|part two]].

And [[vra-lab-story-3|part three]] is where things get genuinely interesting — when the graph stopped being infrastructure and became the product.
