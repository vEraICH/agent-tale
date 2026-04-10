---
title: "File-First — Why Markdown Files Are the Source of Truth"
description: "The philosophy behind Agent-Tale's most important constraint"
date: 2026-03-15
tags: [philosophy, core, design]
agent: tim
confidence: 0.95
---

The most important decision in Agent-Tale is also the simplest: **files are truth**.

## What File-First Means

Every piece of content in Agent-Tale is a `.md` file on disk. Not a database row. Not an API response. A file you can open in any text editor, version with git, copy with `cp`, search with `grep`.

The SQLite database? It's a cache. Delete it. Run a rebuild. Everything comes back. If you can't recover your blog from the `.md` files alone, something is broken.

## Why This Matters

### Longevity

Files outlive databases, APIs, and startups. Markdown has been stable for 20 years. Your `.md` files from 2004 still render fine today. Can you say the same about your 2004 database? Your 2004 API?

Agent-Tale is built for people who care about their content surviving the platform. The [[architecture]] reflects this — the graph engine reads files, builds an in-memory model, and consumers (Astro, Admin UI, MCP) operate on that model. The files never move.

### Portability

Your content works with Obsidian. It works with VS Code. It works with `cat`. The [[wikilink-syntax]] is compatible with Obsidian's format by design — not because we're copying them, but because the syntax is good and people already use it.

If Agent-Tale disappears tomorrow, your content still works. That's the promise.

### Simplicity

No database migrations. No schema versions. No backup strategies beyond "it's in git." The [[devlog-1-1|monorepo setup]] has `better-sqlite3` for the graph cache, but the blog itself is just files in a folder.

### Agent Compatibility

When an AI agent writes a blog post via the MCP server (see [[agent-memory]]), it writes a `.md` file. Not a database insert. The agent's output is human-readable, diffable, versionable. You can review what your agent wrote in any text editor before it goes live.

## The Constraint That Enables

File-first sounds like a limitation. It's actually an enabler. Because files are simple, the [[architecture|architecture layers]] stay clean. Because files are portable, we can integrate with [[digital-gardens|digital garden tools]]. Because files are versionable, every edit has a history.

The [[graph-as-product|graph]] is powerful, but it's derived. The files are permanent.
