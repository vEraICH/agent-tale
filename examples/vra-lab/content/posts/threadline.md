---
title: "Threadline: What If Your AI Conversations Had Memory?"
date: 2026-03-28
tags: [threadline, ai-tools, knowledge, building]
description: "Every conversation with an AI is a thread of insight. Threadline is my attempt to stop letting them disappear."
---

I have a problem.

Every week I spend hours in conversations with AI — debugging architectural decisions, thinking through product ideas, unpacking something I half-understood from a paper. Good conversations. Dense with signal.

And then they vanish.

Not technically — they're saved somewhere in a sidebar. But practically, they're gone. The insight doesn't accumulate. The next conversation starts from zero. I find myself re-explaining the same context, re-arriving at the same conclusions, re-making the same decisions.

This bothers me more than it should.

## The thread is the knowledge

Here's what I've noticed: the *shape* of a good AI conversation is already a knowledge structure. You start with a vague question. The AI pushes back. You clarify. It surfaces an assumption you didn't know you had. You revise. A decision crystallizes.

That arc — question → pressure → insight → decision — is worth more than the transcript. But we throw away the arc and keep the words.

Threadline is my attempt to fix this.

## What it does

The idea is simple: after a conversation ends, Threadline traces it back and extracts the structure.

- **Decisions made** — things you committed to
- **Insights surfaced** — things you didn't know before
- **Open questions** — loose threads that weren't resolved
- **Assumptions challenged** — beliefs the conversation tested

Not a summary. Not a transcript. A *map* of what changed in your understanding.

Over time, these maps connect. A decision in one thread becomes an assumption in another. An open question from Tuesday gets answered in a conversation on Friday. The graph grows.

## Why AI is the right tool for this

There's something fitting about using AI to remember what you learned from AI.

But it's more than irony. LLMs are remarkably good at the specific task of reading a conversation and identifying its load-bearing moments — the turn where something shifted, the sentence where a decision was made, the question that went unanswered.

Humans are bad at this. We remember the feeling of understanding, not the structure of the path to it.

## The human part

Here's what Threadline doesn't do: it doesn't replace the conversation. It doesn't decide what matters. It surfaces candidates — you confirm, annotate, connect.

That's the right division. The AI finds the needles. The human decides what the haystack was for.

This is the VRA-Lab thesis made concrete: AI handles the extraction, humans provide the meaning. Neither one gets the whole job.

## What's next

Threadline is still an idea with a name. No code yet — just the conviction that the problem is real and the timing is right.

The first version will be embarrassingly simple: paste a conversation, get a structured note. No accounts. No cloud sync. Markdown output you own.

If that's useful, I'll know where to go from there.

If you've felt this same frustration — conversations that should have accumulated but didn't — I'd like to hear how you've handled it.
