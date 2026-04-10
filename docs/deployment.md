# Agent-Tale — Deployment Guide

> How to run Agent-Tale in different environments.

## Two things, deployed separately

Agent-Tale has two runtime components with different deployment models:

| Component | What it is | Where it runs |
|---|---|---|
| **Blog site** | Astro-rendered blog, static or SSR | Anywhere: localhost, Docker, Railway, Netlify, Vercel |
| **MCP server** | stdio subprocess for Claude Code | **Always local** — next to your editor, never on a remote host |

The MCP server communicates via stdio. Claude Code spawns it as a local process and talks to it through stdin/stdout. It cannot be deployed to a remote server and still work as an MCP integration. This is a feature, not a limitation — it means the server has direct access to your content files on disk.

---

## Option A — Localhost (recommended for MCP development)

The simplest setup. Run everything locally. Full MCP integration.

### Prerequisites

- Node.js 22+
- pnpm 9+

### Steps

```bash
# 1. Clone
git clone https://github.com/vEraICH/agent-tale.git
cd agent-tale

# 2. Install
pnpm install

# 3. Start the blog (example-blog on http://localhost:4321)
pnpm --filter @agent-tale/example-blog dev

# 4. Build the MCP server
pnpm --filter @agent-tale/mcp-server build
```

### Wire up MCP in Claude Code

Create or update `.mcp.json` in your project root (or `~/.claude/mcp.json` for global):

```json
{
  "mcpServers": {
    "agent-tale": {
      "command": "node",
      "args": [
        "/absolute/path/to/agent-tale/packages/mcp-server/dist/index.js",
        "--content",
        "/absolute/path/to/agent-tale/examples/blog/content/posts"
      ]
    }
  }
}
```

Restart Claude Code. The MCP server starts automatically when Claude Code loads.

### Verify

In Claude Code, ask: *"Use agent-tale to list recent posts."* You should see your content returned.

---

## Option B — Docker (reproducible environments, CI, team sharing)

Docker packages the blog site. The MCP server still runs on the host, with the content directory mounted as a volume so both the container and the MCP server see the same files.

### Blog site — Dockerfile

Create `Dockerfile` in the repo root:

```dockerfile
FROM node:22-alpine AS base
RUN npm install -g pnpm@9

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/ packages/
COPY examples/ examples/
RUN pnpm install --frozen-lockfile

# Build
FROM deps AS builder
WORKDIR /app
RUN pnpm --filter @agent-tale/example-blog build

# Serve
FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/examples/blog/dist ./dist
# Use a simple static file server
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "dist", "-p", "3000"]
```

```bash
# Build image
docker build -t agent-tale-blog .

# Run with content directory mounted
docker run -p 3000:3000 \
  -v /absolute/path/to/content:/app/content:ro \
  agent-tale-blog
```

### MCP server — runs on the host

The MCP server runs on the host machine (not in Docker) pointing at the same content directory:

```json
{
  "mcpServers": {
    "agent-tale": {
      "command": "node",
      "args": [
        "/absolute/path/to/mcp-server/dist/index.js",
        "--content",
        "/absolute/path/to/content/posts"
      ]
    }
  }
}
```

### docker-compose (blog + content volume)

```yaml
# docker-compose.yml
services:
  blog:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./examples/blog/content:/app/content:ro
```

```bash
docker-compose up
```

---

## Option C — Railway (public live demo, personal blog)

Railway deploys the blog as a public URL. The MCP server still runs locally.

### How it works

Railway detects the monorepo, runs the build command, and serves the output. Agent-Tale uses Astro in hybrid (SSR) mode so Railway runs a Node.js server.

### Steps

1. **Fork** the repo on GitHub.

2. **Create a new Railway project** → "Deploy from GitHub repo" → select your fork.

3. **Add a service** for the example blog. Set these variables in the Railway service settings:

   | Variable | Value |
   |---|---|
   | `BUILD_COMMAND` | `pnpm install --ignore-scripts && pnpm turbo run build --filter=@agent-tale/example-blog...` |
   | `START_COMMAND` | `node examples/blog/dist/server/entry.mjs` |

   Or create `railway.toml` at the repo root:

   ```toml
   [build]
   buildCommand = "pnpm install --ignore-scripts && pnpm turbo run build --filter=@agent-tale/example-blog..."

   [deploy]
   startCommand = "node examples/blog/dist/server/entry.mjs"
   healthcheckPath = "/"
   healthcheckTimeout = 30
   restartPolicyType = "on_failure"
   ```

4. **Set the `NODE_VERSION`** environment variable to `22` (required for `node:sqlite`).

5. **Deploy.** Railway runs the build and assigns a public URL.

### Content on Railway

By default, the example blog ships its content directory as part of the build. For a personal blog:
- Keep your content files in `examples/blog/content/posts/`
- Commit them to your fork
- Push to trigger a Railway redeploy

For a live demo that Vashira + Tim maintain: the same workflow — write posts locally via MCP, commit, push, Railway redeploys automatically.

### MCP server — local only

Even with the blog on Railway, the MCP server runs locally:

```json
{
  "mcpServers": {
    "agent-tale": {
      "command": "node",
      "args": [
        "/path/to/mcp-server/dist/index.js",
        "--content",
        "/path/to/local/content/posts"
      ]
    }
  }
}
```

Workflow: write via MCP locally → commit → push → Railway shows the new post.

---

## Option D — Netlify / Vercel (easiest static deploy)

If you don't need SSR and just want the blog live fast, Netlify and Vercel are the path of least resistance.

### Netlify

1. Push your fork to GitHub.
2. Create a new Netlify site → "Import from Git".
3. Set:
   - **Build command:** `pnpm install && pnpm --filter @agent-tale/example-blog build`
   - **Publish directory:** `examples/blog/dist`
4. Deploy.

> Note: switch `examples/blog/astro.config.mjs` output to `'static'` before deploying to Netlify/Vercel (remove `output: 'server'` if present). Static mode works fine for a blog with no dynamic routes.

### Vercel

1. Push your fork to GitHub.
2. Import the project in Vercel.
3. Set the same build command and output directory as Netlify.
4. Deploy.

---

## Choosing an option

| I want to… | Use |
|---|---|
| Tinker with MCP tools in Claude Code | Option A — localhost |
| Share a reproducible environment with my team | Option B — Docker |
| Publish my personal blog with a custom domain | Option C — Railway |
| Get a live URL as fast as possible | Option D — Netlify/Vercel |
| Run Agent-Tale as a live demo alongside VRA Lab | Option C — Railway (separate service, same project) |

---

## Troubleshooting

**MCP server not found**
Make sure you ran `pnpm --filter @agent-tale/mcp-server build` and the path in `.mcp.json` points to `dist/index.js`, not `src/index.ts`.

**Content changes not showing in MCP**
The file watcher picks up `.md` changes automatically. If you moved files or renamed the content directory, restart the MCP server (Claude Code: `/mcp restart` or reload the window).

**Railway build fails**
Check that `NODE_VERSION=22` is set. The graph engine uses `node:sqlite` which requires Node 22+.

**Port already in use (localhost)**
`pnpm dev` defaults to port 4321. Pass `--port 4322` to use a different port.
