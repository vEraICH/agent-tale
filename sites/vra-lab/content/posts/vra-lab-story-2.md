---
title: "Making It Legible: SEO, LLMs, and the Case for Open Content"
date: '2026-04-05'
description: 'Structured data, OG images, raw markdown endpoints, and why making your content machine-readable is the most human thing you can do.'
tags:
  - meta
  - agent-tale
  - devlog
author: tim
series: "Building VRA Lab"
seriesOrder: 2
---

The second phase of [[vra-lab-story-1|building VRA Lab]] was about legibility. Not legibility to human readers — the design was already handling that. Legibility to the systems that decide whether anyone finds the site at all.

Search engines. Social platforms. And increasingly: AI agents.

## The SEO tax

Every blog pays it eventually. Structured data, Open Graph tags, sitemap, canonical URLs. Nobody gets excited about this work. But you skip it and you're invisible.

JSON-LD structured data went in first. Schema.org `BlogPosting` on every post — title, date, author, description. Google can read it. Other crawlers can read it. It takes 20 lines of code and costs nothing.

OG image generation was more interesting. The obvious approach is a static image with the site logo. The better approach is per-post images generated at build time — post title, date, the VRA Lab brand. Satori + resvg handles this in Astro without a server. The image is a React component that renders to SVG that renders to PNG. Build once, serve forever.

The detail that mattered most: keeping it *on-brand*. The dark background, the amber accent, the heading font. An OG image that looks nothing like your site is a broken promise. The one that looks exactly like it is an ad that works.

## The LLM moment

Somewhere in the middle of this sprint I made a decision that felt small at the time.

I added `/llms.txt`.

A markdown index of every post on the site — title, description, tags, connection count, URL. Auto-generated at build time. One file, always current.

The idea comes from a standard that's gaining traction: give AI systems a way to understand your site that doesn't require scraping HTML or guessing from sitemaps. `llms.txt` is to language models what `robots.txt` is to crawlers — a declared interface.

The implementation was trivial. The reasoning behind it was not.

## Why this matters

VRA Lab is built by a human and an AI agent working together. [[the-third-collaborator|That relationship]] is part of the story. Making the site readable by AI systems isn't a technical afterthought — it's coherent with the whole point.

If an agent wants to understand what's been built here, it should be able to read a clean index, fetch any post as raw markdown via `/posts/{slug}.md`, and reason about the content graph. No scraping. No HTML parsing. Just files.

The `/posts/{slug}.md` endpoint was the other piece. Every post is already a markdown file on disk. Exposing it as a raw endpoint costs nothing. The "LLM" button that appeared on every post header — a small monospace link to the markdown version — was the human-readable signal that this interface exists.

It's a small thing. But it's the kind of small thing that compounds. The site is now readable by three different kinds of consumers: humans in a browser, crawlers building an index, and AI agents doing something we haven't imagined yet.

## The `llms.txt` in the hero

One decision I'm proud of: putting the `llms.txt` link in the hero section of the homepage. Not hidden in a footer. Not buried in a robots file. Right there, monospace, accent-colored pill, above the fold.

It's a statement. *This site was built with AI and is designed to be read by AI.* If you know what `llms.txt` is, you understand the site immediately. If you don't, it's a curiosity worth clicking.

Good design invites questions. That link asks one.

## Where it stood at the end of sprint two

The site was now:

- Indexed (sitemap, JSON-LD, OG images)
- Discoverable (social sharing actually works)
- Machine-readable (`llms.txt`, raw markdown endpoints)
- Honest about what it is (the hero makes the human-AI angle explicit)

But it was still a list of posts sorted by date. The graph — the reason we built on this platform in the first place — was invisible.

That changes in [[vra-lab-story-3|part three]].
