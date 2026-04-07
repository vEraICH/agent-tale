# LLM Memory Systems — Research Summary

> Research context: how to make Agent-Tale compatible with LLM memory systems and auto-research patterns.
> Date: 2026-04-07

---

## 1. Memory Taxonomy

The field has consolidated around a five-type cognitive model borrowed from human neuroscience, extended with functional categories specific to AI agents.

### Cognitive Types

| Type | What it stores | Agent analog |
|---|---|---|
| **Sensory** | Immediate perceptual input | Raw text/JSON ingested in current turn |
| **Working** | Active, short-lived context | The LLM's context window; in-flight task state |
| **Episodic** | Specific past events with temporal/contextual binding | Timestamped interaction records, devlog posts |
| **Semantic** | General facts, entities, world knowledge | Extracted concepts, canonical facts — the knowledge graph |
| **Procedural** | How to do things; skills | System prompt rules, agent-updatable instructions |

### Functional Extensions (2025 research consensus)

The ACM survey and the ICLR 2026 MemAgents workshop converge on a **three-tier functional model**:

1. **Factual memory** — stable facts about entities and their relationships (feeds semantic layer)
2. **Experiential memory** — insights, preferences, interaction history that accumulates over time (episodic + distilled)
3. **Working context** — active task state, populated at inference time from the other two

### Consolidation as a First-Class Operation

A notable 2025 research theme: **episodic-to-semantic consolidation** — the process by which raw event logs are periodically compressed into durable semantic facts. This mirrors sleep-phase consolidation in humans, and is implemented explicitly in Mem0, Zep, and MIRIX.

Key papers:
- ["Memory in the Age of AI Agents"](https://arxiv.org/abs/2512.13564) (2025)
- ["Anatomy of Agentic Memory"](https://arxiv.org/html/2602.19320v1) (2026)

---

## 2. Protocols and Leading Implementations

### MCP as the Standard Transport

**Model Context Protocol (MCP)** is the de facto transport for agent-memory integration. Supported by Claude, GPT, Gemini, and all major agent frameworks. As of early 2026, "agent memory" is treated as a near-first-class MCP primitive.

The canonical MCP memory tool surface (from [OpenMemory MCP](https://mem0.ai/blog/introducing-openmemory-mcp) and the [MCP memory service](https://github.com/doobidoo/mcp-memory-service)):

```
add_memories(content, metadata?)     → store new memory unit
search_memory(query, limit?)         → semantic + keyword retrieval
list_memories(filter?)               → enumerate stored memories
delete_all_memories()                → clear store
```

Extended by some implementations:
```
retain(content)        → store with confidence metadata
recall(query)          → multi-strategy retrieval (semantic + keyword + graph)
reflect(topic)         → synthesize insights across memories
```

11,150+ MCP servers now listed on PulseMCP; hundreds relate to memory. Transport is a solved problem.

### Leading Implementations

#### Mem0 — Production leader
- Architecture: hybrid store combining vectors, graph relationships, and key-value lookup
- Scopes: `user_id`, `agent_id`, `run_id`, `app_id` — flexible composition at retrieval
- Performance: 66.9% accuracy at 1.4s P95 latency; 91% faster than full-context approaches
- Beats OpenAI's built-in memory by 26% accuracy
- OpenMemory MCP: local-only variant, privacy-first
- Supports 21 frameworks, 19 vector backends

#### Zep / Graphiti — Temporal knowledge graph leader
- Architecture: three-tier hierarchical graph:
  - **Episode subgraph** — raw data
  - **Semantic entity subgraph** — extracted entities + relationships
  - **Community subgraph** — clustered summaries
- Bi-temporal model: tracks both *event time* (when a fact was true) and *ingestion time* (when it was recorded) — every edge has four timestamps
- Retrieval: cosine similarity + BM25 + breadth-first graph traversal, combined via reciprocal rank fusion. No LLM calls during retrieval. P95 latency: 300ms
- DMR benchmark: 94.8% accuracy (beats MemGPT's 93.4%)
- Paper: [arxiv.org/abs/2501.13956](https://arxiv.org/abs/2501.13956)
- Open-source: [github.com/getzep/graphiti](https://github.com/getzep/graphiti)

#### Letta / MemGPT — OS-model pioneer
- Three-tier OS metaphor: **core memory** (always in context = RAM), **archival memory** (searchable vector store = disk), **recall memory** (conversation history)
- Best for long-running agents needing OS-level memory management
- Accuracy: 93.4% on DMR benchmark

#### LangMem — Procedural memory innovation
- Three memory types: episodic (past interactions), semantic (facts and preferences), **procedural** (agents can update their own system instructions)
- Best choice when already on LangChain/LangGraph

#### A-MEM / Zettelkasten — Graph-native memory (NeurIPS 2025)
- Each memory unit is a **note** with: raw content, timestamp, LLM-generated keywords, tags, contextual description, dense embedding, and a link set
- On insertion: finds nearest neighbors (cosine similarity), establishes links where meaningful
- On update: new memories trigger **retroactive re-evaluation** of existing notes' contextual representations
- The graph evolves — links are not static, they get refined over time
- Directly implements Zettelkasten principles; architecturally closest to Agent-Tale's wikilink model
- Paper: [arxiv.org/abs/2502.12110](https://arxiv.org/abs/2502.12110)

---

## 3. Auto-Research Patterns

### RAG Evolution: Flat to Graph

Traditional RAG: chunk text → embed → store in vector DB → retrieve by similarity. Fast but loses relational structure and temporal context.

**GraphRAG** (now the production standard for complex queries): entities extracted from text → stored as nodes + edges in a knowledge graph → retrieval combines graph traversal with semantic search. Achieves 85%+ accuracy vs. 70% for vector-only on knowledge-intensive tasks.

### Karpathy's Markdown-First Architecture (April 2026)

Karpathy published an architecture he calls "LLM Knowledge Bases" that directly validates Agent-Tale's design ([techbuddies.io breakdown](https://www.techbuddies.io/2026/04/04/inside-karpathys-llm-knowledge-base-a-markdown-first-alternative-to-rag-for-autonomous-archives/)):

- Raw materials ingested as markdown into `raw/`
- LLM *authors* the knowledge base: writes encyclopedia articles, summaries, explicit backlinks
- "Health check" linting runs continuously to find inconsistencies and missing connections
- The LLM is the librarian, not the retriever — it actively maintains the graph
- Explicitly uses backlinks as first-class connective tissue
- Rejects vector DBs for datasets of "hundreds to tens of thousands" high-signal documents
- "File-over-app" philosophy: markdown ensures portability, every claim is auditable

**This is Agent-Tale's architecture, described independently by one of the field's most credible voices.**

### Hybrid Retrieval (production consensus)

Every leading system uses hybrid retrieval combining at least two strategies:

1. **Semantic embeddings** — broad, fuzzy recall
2. **Keyword / BM25** — precise term matching
3. **Graph traversal** — relational, multi-hop reasoning

Zep's implementation combines all three without any LLM calls in the retrieval path, achieving 300ms P95.

---

## 4. Knowledge Graph as Memory

### Why Knowledge Graphs Beat Flat Stores for Agents

From the Zep paper and GraphRAG research:

- **Explicit relationships** — edges encode semantics that embeddings only approximate
- **Multi-hop reasoning** — "what is related to X through Y?" is graph traversal, not similarity search
- **Temporal validity** — edges carry validity windows; facts that were true *then* but not *now* are preserved, not overwritten
- **Community summaries** — clusters of highly connected nodes generate high-level domain understanding automatically
- **Contradiction handling** — when a new fact contradicts an old one, the old edge gets `t_invalid` stamped; history preserved, not destroyed

### The Wikilink as a Memory Primitive

A-MEM (NeurIPS 2025) demonstrated that treating memory units as **Zettelkasten notes with explicit bidirectional links** outperforms flat vector stores across six foundation models.

Key insight: links encode *intentional* semantic proximity, not just statistical similarity. This is exactly what `[[wikilinks]]` do in Agent-Tale — they are author-intentional edges, which is a stronger signal than cosine similarity alone.

GAAMA (Graph Augmented Associative Memory for Agents, [arxiv.org/html/2603.27910](https://arxiv.org/html/2603.27910)): graph augmentation consistently improves associative recall and multi-step reasoning compared to pure embedding approaches.

---

## 5. What "Memory-Compatible" Means

Based on convergent design across Mem0, Zep, OpenMemory MCP, and the SHODH Unified Memory API Specification.

### Minimum Viable Memory Interface (6 operations)

```
write(content, metadata)           → store a memory unit, return id
read(id)                           → retrieve by exact identifier
search(query, limit, filter)       → semantic + keyword retrieval
get_related(id, depth)             → graph-neighbor retrieval
list(filter)                       → enumerate with metadata filtering
delete(id)                         → remove a memory unit
```

### Minimum Metadata Schema

```typescript
{
  id: string,              // stable identifier
  content: string,         // human-readable text
  created_at: timestamp,
  updated_at: timestamp,
  agent_id?: string,       // which agent wrote this
  user_id?: string,        // which user context
  confidence?: number,     // 0-1 epistemic certainty
  sources?: string[],      // provenance URLs
  tags?: string[],         // categorical labels
  links?: string[],        // explicit connections to other memory ids
}
```

### Retrieval Quality Requirements

- Async-first writes (don't block the agent on memory storage)
- Hybrid retrieval (vector + keyword minimum; graph traversal for high-value systems)
- Reranking before returning results (reciprocal rank fusion or cross-encoder)
- P95 latency under 1.5 seconds for search
- Framework-agnostic: any agent framework must be able to connect

### What "Memory-Compatible" is NOT

- Not just RAG (chunking + vector DB is a minimum bar, not a differentiator)
- Not locked to one framework
- Not cloud-only (local/on-device is first-class in 2026)
- Not append-only (memories must be updatable and invalidatable with history preserved)

---

## 6. Integration Ideas for Agent-Tale

Agent-Tale already has: SQLite graph index, wikilink-based edges, bidirectional link tracking, MCP server (planned), markdown as source of truth, and frontmatter fields for `agent`, `confidence`, and `sources`. Strong foundation.

### Idea 1 — Memory-Scoped MCP Tools *(low effort, immediate value)*

Add a thin adapter layer over the existing MCP tools (tasks 2.5/2.6) that speaks the OpenMemory API. Posts *are* memories — just needs memory-compatible naming and a `memory` collection type:

```typescript
store_memory({ content, tags, agent_id, confidence, sources })
  → write_post() to memory collection

retrieve_memory({ query, limit })
  → search() + graph context returned together

get_memory_context({ slug, depth })
  → get_graph_neighborhood()
```

Any MCP-compatible agent treats Agent-Tale as a drop-in memory backend with zero architecture change.

### Idea 2 — Bi-Temporal Frontmatter *(medium effort, major semantic upgrade)*

Adopt Zep's bi-temporal model at the frontmatter level:

```yaml
---
title: "Claude supports tool_use in streaming"
date: 2025-11-01           # event_time: when this fact became true
updated: 2026-01-15        # ingestion_time: when we recorded it
valid_until: ~             # null = still valid; set to invalidate without deleting
superseded_by: claude-streaming-update-jan2026  # wikilink to replacement
confidence: 0.9
sources:
  - https://docs.anthropic.com/...
---
```

Every post becomes a **temporally bounded fact**. Agents can query: *"what did we believe about X in Q4 2025?"* The SQLite graph index already stores all this — it just needs schema extension.

### Idea 3 — Agent-Authored Consolidation *(medium effort, high differentiation)*

Implement Karpathy's "LLM librarian" pattern natively. Add an MCP tool:

```typescript
consolidate_memories({ topic, source_slugs })
→ agent reads N episodic posts, authors a new semantic summary post
→ summary post wikilinks back to all sources
→ sources get consolidated_into: [[summary-slug]] in frontmatter
→ graph now has episodic layer → semantic layer structure
```

This implements episodic-to-semantic consolidation in Agent-Tale's native format — making consolidation itself **auditable and human-readable**. No other memory system does this. Every existing system consolidates into an opaque vector store. Agent-Tale consolidates into markdown you can open, read, and follow backlinks through.

### Idea 4 — Hybrid Retrieval for the `search` Tool *(medium effort, correctness improvement)*

Implement three retrieval strategies combined via reciprocal rank fusion:

1. **SQLite FTS5** — full-text, zero dependencies, already rebuildable from markdown
2. **Graph traversal** — `getRelated(slug, depth)`, already in the Graph interface
3. **Optional embeddings** — task 3.7 already planned; plug in as a third ranking signal

SQLite FTS5 + graph traversal alone outperforms pure embedding search for a connected knowledge graph. Matches Zep's 300ms P95 pattern without requiring a vector DB for MVP.

### Idea 5 — Memory Identity Layer *(higher effort, platform-level)*

Decouple **memory identity** from **content identity** in SQLite:

```sql
CREATE TABLE memory_contexts (
  id          TEXT PRIMARY KEY,   -- stable UUID, not slug
  slug        TEXT REFERENCES nodes(slug),
  agent_id    TEXT,
  user_id     TEXT,
  session_id  TEXT,
  scope       TEXT,               -- 'session' | 'agent' | 'global'
  valid_from  INTEGER,            -- unix timestamp
  valid_until INTEGER,            -- null = indefinite
  confidence  REAL
);
```

A single post can appear in multiple memory contexts. An agent searching for "what do I know about Astro" gets different ranked results than a human browsing the public blog — same data, different memory lens. Equivalent to Mem0's `user_id + agent_id + run_id + app_id` scoping, implemented natively in SQLite.

---

## Key Takeaways

1. **The architecture is already correct.** Markdown-as-truth + bidirectional wikilinks + SQLite graph index is independently validated by Karpathy (April 2026), A-MEM (NeurIPS 2025), and Zep's temporal graph model.

2. **`[[wikilinks]]` are a stronger memory primitive than embeddings.** They are author-intentional edges. This is Agent-Tale's genuine competitive advantage over vector-DB-based memory systems.

3. **MCP is the right transport.** No second-guessing needed.

4. **Missing pieces**: memory-scoped MCP tool naming, bi-temporal frontmatter for fact validity, hybrid retrieval combining SQLite FTS + graph traversal, memory identity/scoping metadata.

5. **Consolidation is the killer feature.** No existing memory system exposes consolidation as human-readable, auditable markdown. If Agent-Tale implements Idea 3, it becomes the first memory backend where you can *read* how an agent's knowledge was built — a fundamentally different trust model than opaque vector stores.

---

## Sources

- [Memory in the Age of AI Agents (arxiv.org)](https://arxiv.org/abs/2512.13564)
- [Anatomy of Agentic Memory (arxiv.org)](https://arxiv.org/html/2602.19320v1)
- [From Human Memory to AI Memory: A Survey (arxiv.org)](https://arxiv.org/html/2504.15965v1)
- [MIRIX: Multi-Agent Memory System (arxiv.org)](https://arxiv.org/pdf/2507.07957)
- [State of AI Agent Memory 2026 (mem0.ai)](https://mem0.ai/blog/state-of-ai-agent-memory-2026)
- [Best AI Agent Memory Frameworks 2026 (atlan.com)](https://atlan.com/know/best-ai-agent-memory-frameworks-2026/)
- [Mem0 vs Zep vs LangMem comparison (dev.to)](https://dev.to/anajuliabit/mem0-vs-zep-vs-langmem-vs-memoclaw-ai-agent-memory-comparison-2026-1l1k)
- [Benchmarked: OpenAI Memory vs LangMem vs MemGPT vs Mem0 (mem0.ai)](https://mem0.ai/blog/benchmarked-openai-memory-vs-langmem-vs-memgpt-vs-mem0-for-long-term-memory-here-s-how-they-stacked-up)
- [Zep: A Temporal Knowledge Graph Architecture (arxiv.org)](https://arxiv.org/abs/2501.13956)
- [Graphiti: Knowledge Graph Memory for an Agentic World (neo4j.com)](https://neo4j.com/blog/developer/graphiti-knowledge-graph-memory/)
- [Graphiti GitHub (github.com/getzep)](https://github.com/getzep/graphiti)
- [A-MEM: Agentic Memory for LLM Agents (arxiv.org)](https://arxiv.org/abs/2502.12110)
- [GAAMA: Graph Augmented Associative Memory (arxiv.org)](https://arxiv.org/html/2603.27910)
- [Introducing OpenMemory MCP (mem0.ai)](https://mem0.ai/blog/introducing-openmemory-mcp)
- [MCP Memory Service GitHub (doobidoo)](https://github.com/doobidoo/mcp-memory-service)
- [Graph-Based Memory Solutions: Top 5 (mem0.ai)](https://mem0.ai/blog/graph-memory-solutions-ai-agents)
- [Karpathy's LLM Knowledge Base Architecture (techbuddies.io)](https://www.techbuddies.io/2026/04/04/inside-karpathys-llm-knowledge-base-a-markdown-first-alternative-to-rag-for-autonomous-archives/)
- [RAG vs GraphRAG in 2025 (medium.com)](https://medium.com/@Quaxel/rag-vs-graphrag-in-2025-a-builders-field-guide-82bb33efed81)
- [Retrieval-Augmented Generation with Graphs: GraphRAG (arxiv.org)](https://arxiv.org/html/2501.00309v2)
- [MCP Specification 2025-11-25 (modelcontextprotocol.io)](https://modelcontextprotocol.io/specification/2025-11-25)
