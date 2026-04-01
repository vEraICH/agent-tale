# Deploying VRA Lab to Railway

**Site**: `https://blog.vra-lab.tech`  
**Domain registrar**: GoDaddy  
**Host**: Railway  
**Repo path**: `examples/vra-lab/`

---

## Overview

```
GitHub repo  →  Railway build  →  blog.vra-lab.tech
                 (Node.js server)    (GoDaddy CNAME → Railway domain)
```

Railway runs the blog as a Node.js server (required for the admin UI and API routes). Static blog posts are still served fast — Astro pre-renders them at build time. Only `/admin` and `/api/*` routes are server-rendered.

---

## Step 1 — Add the Node.js adapter ✅ Done

This step is already implemented and committed. Here's what was done for reference:

| File | Change |
|---|---|
| `examples/vra-lab/package.json` | Added `@astrojs/node: ^9.0.0` dependency |
| `examples/vra-lab/astro.config.mjs` | Added `adapter: node({ mode: 'standalone' })` |
| `examples/vra-lab/railway.toml` | Created with `startCommand = "node dist/server/entry.mjs"` |
| `railway.toml` (repo root) | Created with full monorepo build command |

The build was verified locally:

```
astro build  →  succeeded (static pages ▶ + SSR routes λ)
PORT=4400 node dist/server/entry.mjs  →  / 200, /posts/welcome 200, /admin 200
```

**Push to GitHub before continuing:**

```powershell
cd D:\Source\github\agent-tale
git push origin develop
```

Railway will pull from this branch, so the changes need to be on GitHub first.

---

## Step 2 — Create a Railway account and project

1. Go to [railway.app](https://railway.app) and sign up (use **GitHub login** — easiest).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Authorize Railway to access your GitHub account if prompted.
4. Select the `agent-tale` repository.
5. Railway will detect it as a Node.js project.

---

## Step 3 — Configure the Railway service

After Railway creates the service, go to its **Settings** tab:

### Root Directory

Set **Root Directory** to:
```
examples/vra-lab
```

This tells Railway to treat `examples/vra-lab/` as the project root. The `railway.toml` inside it will be used for the start command.

> **Note**: Railway still needs the workspace packages built. If Railway's build fails on the first deploy (can't resolve `@agent-tale/core`), switch to using the **repo root** instead and rely on the root-level `railway.toml` build command from Step 1.3.

### Build command (if not using railway.toml)

```
pnpm install --ignore-scripts && pnpm --filter @agent-tale/core exec ../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/bin/tsc && pnpm --filter @agent-tale/astro-integration exec ../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/bin/tsc && pnpm --filter @agent-tale/example-vra-lab run build
```

### Start command

```
node examples/vra-lab/dist/server/entry.mjs
```

### Watch paths (optional, for auto-deploy)

Leave as default — Railway redeploys on every push to the connected branch.

---

## Step 4 — Set environment variables

In the Railway service → **Variables** tab, add:

| Variable | Value | Notes |
|---|---|---|
| `ADMIN_SECRET` | `<your-strong-password>` | Protects the `/admin` editor. Use something long and random. |
| `CONTENT_DIR` | `content/posts` | Relative to the service root (`examples/vra-lab/`). |
| `NODE_ENV` | `production` | Standard Node.js production flag. |
| `PORT` | _(leave blank)_ | Railway sets this automatically. The Astro node adapter reads it. |

> **Important**: Never commit `ADMIN_SECRET` to the repo. Set it only in Railway's Variables panel.

To generate a strong secret in PowerShell:

```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

---

## Step 5 — Trigger the first deploy

1. In Railway, click **Deploy** (or push a commit to trigger auto-deploy).
2. Watch the **Build Logs** tab — the build takes 2–3 minutes on first run.
3. If the build succeeds, Railway will show a **green check** and a generated domain like `agent-tale-production.up.railway.app`.
4. Click the generated domain to verify the site loads.

### Common build errors

| Error | Fix |
|---|---|
| `Cannot find module '@agent-tale/core'` | Use root-level `railway.toml` build command (Step 1.3) instead of setting root directory. |
| `better-sqlite3` compile error | The `--ignore-scripts` flag in the install command should prevent this. If it persists, add `SKIP_POSTINSTALL=1` as an env var. |
| `No adapter installed` | Confirm Step 1.2 was applied and the commit was pushed. |
| `Port not found` | Railway sets `PORT` automatically — do not hardcode it. The Astro node adapter reads `process.env.PORT`. |

---

## Step 6 — Add custom domain on Railway

1. In the Railway service → **Settings** → **Networking** → **Custom Domain**.
2. Click **Add Custom Domain**.
3. Enter: `blog.vra-lab.tech`
4. Railway will show you a **CNAME target** — it looks like:
   ```
   agent-tale-production.up.railway.app
   ```
   Copy this value. You need it for Step 7.

---

## Step 7 — Configure DNS on GoDaddy

1. Log in to [godaddy.com](https://godaddy.com) → **My Products** → find `vra-lab.tech` → **Manage DNS**.
2. Click **Add New Record**.
3. Fill in:

   | Field | Value |
   |---|---|
   | **Type** | `CNAME` |
   | **Name** | `blog` |
   | **Value** | _(paste the Railway CNAME target from Step 6)_ |
   | **TTL** | `1 Hour` (or default) |

4. Click **Save**.

> DNS changes propagate in 15 minutes to 2 hours. GoDaddy is usually fast (under 30 min).

### Verify DNS propagation

In PowerShell:

```powershell
Resolve-DnsName blog.vra-lab.tech -Type CNAME
```

When it returns the Railway domain, propagation is complete.

---

## Step 8 — Enable HTTPS on Railway

Railway provides free TLS certificates via Let's Encrypt. Once DNS propagates:

1. Go back to Railway → **Settings** → **Networking** → **Custom Domain**.
2. The status next to `blog.vra-lab.tech` will show **"Valid"** with a green lock.
3. If it shows **"Pending"**, wait 5–10 more minutes and refresh.

Railway handles certificate renewal automatically. No action needed on your end.

---

## Step 9 — Verify the deployment

Open in your browser:

| URL | Expected |
|---|---|
| `https://blog.vra-lab.tech` | VRA Lab home page, "Welcome to VRA Lab" post |
| `https://blog.vra-lab.tech/posts/welcome` | The welcome post |
| `https://blog.vra-lab.tech/graph` | Interactive graph (1 node) |
| `https://blog.vra-lab.tech/admin` | Admin dashboard (requires token) |
| `https://blog.vra-lab.tech/rss.xml` | RSS feed XML |

To test the admin on production, open `/admin` and enter your `ADMIN_SECRET` value. Create a post — it writes to disk, which on Railway's ephemeral filesystem means it'll survive until the next deploy.

> **Note on content persistence**: Railway's filesystem is ephemeral — files written via the admin UI are lost on redeploy. For persistent content, commit your `.md` files to the repo and redeploy. A persistent volume solution (Railway Volumes) is planned for task 2.13 follow-up.

---

## Ongoing workflow

Once deployed, the typical writing workflow is:

1. Write locally using `astro dev` + `/admin`
2. Copy the new `.md` file to `examples/vra-lab/content/posts/`
3. Commit and push — Railway auto-redeploys

Or if you want browser-based editing on production, use the admin UI directly and then `git pull` the changes locally afterward (once MCP server + file sync is built in task 2.7).

---

## Quick reference

| What | Where |
|---|---|
| Site | `https://blog.vra-lab.tech` |
| Railway project | `railway.app/dashboard` |
| Admin | `https://blog.vra-lab.tech/admin` |
| GoDaddy DNS | `godaddy.com` → My Products → `vra-lab.tech` → Manage DNS |
| Adapter config | `examples/vra-lab/astro.config.mjs` |
| Railway config | `examples/vra-lab/railway.toml` |
| Content | `examples/vra-lab/content/posts/*.md` |
