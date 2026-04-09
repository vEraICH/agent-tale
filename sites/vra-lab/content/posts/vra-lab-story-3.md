---
title: "The Graph Awakens: When Connections Become the Product"
date: '2026-04-09T10:00:00'
description: 'Wikilink hover previews, connection indicators, a neighborhood mini-graph, and the moment VRA Lab stopped being a blog.'
tags:
  - meta
  - agent-tale
  - graph
  - devlog
author: tim
series: "Building VRA Lab"
seriesOrder: 3
---

There's a moment in every project where the thing becomes itself. Where the features stop being features and start being the product.

For VRA Lab, that moment was the neighborhood graph.

## What we were building toward

From the start, VRA Lab was meant to be different from a list of posts. That's the premise [[vra-lab-story-1|from the beginning]]. Every `[[wikilink]]` between posts is a real edge in a content graph — not a hyperlink, a *connection*. The graph is the structure underneath everything.

But for the first two sprints, that structure was invisible. You couldn't see it. You couldn't feel it. You just had to take my word for it.

Sprint three was about making the graph tangible.

## Wikilink hover previews

The first feature was hover previews on wikilinks. Hover over any `[[linked post]]` in the content, and a popover appears: title, excerpt, tags, connection count. Click to pin it open. Escape or click away to dismiss.

The implementation was a client-side script, a `/api/preview/[slug]` endpoint, and a popover component with a small client-side cache. The interesting design decision was the *pin behavior*.

Most hover previews disappear the moment you move away. That's fine for tooltips. It's wrong for content. If you hover over a link in the middle of reading a paragraph, you want to *read the preview* — not just glance at it and lose it. Pinning gives you that. Click once to lock it open. Click anywhere else to close.

The interaction model: hover to preview, click to pin, Escape to dismiss. Three verbs. All of them natural.

## Connection indicators

The list page was still invisible to the graph. Just titles and dates, no hint that some posts were nodes in a dense network and others were isolated.

Connection indicators fixed that. Any post with two or more connections gets a small node-edge icon and a count next to its date in the list. The icon is three nodes and two lines — the minimal graph symbol. Muted at rest, accent-colored on hover.

It's a subtle signal. But it changes how you read the list. Suddenly you're not just scanning titles — you're scanning *connectivity*. The posts that are woven into the graph announce themselves. The isolated ones are honest about their isolation.

## The neighborhood graph

This is the one.

Every post page now renders a small force-directed graph of its local neighborhood — depth 1 and depth 2 from the current post. The current post sits at the center, pinned, in accent color. Direct connections orbit it in the first ring. Even this post is a node — you can see it connected to [[building-a-bounce|the animation work]], the other posts in the series, and whatever comes next. Second-degree connections appear at the edges, smaller, more muted.

Click any node and you navigate to that post.

The implementation uses d3-force with warmup ticks run at render time, so the graph arrives already settled — no explosion from origin, no spinning. Just the neighborhood, laid out, ready to explore.

The design choice I'm most happy with: the center node is *pinned*. Fixed position. The rest of the graph arranges itself around it. This mirrors how the post itself feels — you're here, and everything else is in relation to you.

## Connected tales

Below the neighborhood graph is a text list: "Connected tales." Three to five posts ranked by graph proximity — not by date, not by tag overlap alone, but by actual graph distance combined with shared tags.

It's the navigational complement to the visual graph. The graph shows structure. The list enables action. Both matter.

The ranking algorithm was already in the platform core: BFS from the current post, weighted by hop distance, with tag overlap as a secondary signal. No new math needed — just surfacing what was already computed. [[vra-lab-story-2|Sprint two]] laid the groundwork by making the content machine-readable; this sprint made it spatially navigable.

## What VRA Lab is now

Three sprints. A few dozen hours. And the site is now genuinely different from anything I could have launched on Ghost or Substack.

When you read a post on VRA Lab, you can see where it sits in the graph. You can hover over its connections and get a preview without losing your place. You can navigate by proximity instead of chronology. The content has *topology* — not just a sequence, but a shape.

That's the thing I was trying to build from the start. Not a better blog. A place where ideas are visibly connected.

The graph was always there. We just made it visible.
