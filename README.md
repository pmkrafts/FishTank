# FishTank

A shared, brutalist digital aquarium. Upload a photo or type a label, clip it to a fish silhouette, and release it into a global tank. Fish live for 5 minutes; each visitor can release one fish every 4 hours.

---

## Stack

| Layer | Tech |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| Frontend | Astro 6 + React 19 |
| Styling | Tailwind CSS 4 + custom brutalist CSS |
| Aquarium | PixiJS v8 |
| Backend | Hono |
| Production runtime | Cloudflare Workers (D1, R2, KV) |
| Local runtime | Node.js + `node:sqlite` + filesystem |
| Identity | FingerprintJS Pro (optional) |

---

## Requirements

- **Node.js** ≥ 24
- **pnpm**

Install dependencies once:

```bash
pnpm install
```

> **Windows PowerShell:** if `pnpm` is blocked by execution policy, run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` or use `cmd.exe`.

---

## Run on Your Local Machine

No Cloudflare account or `wrangler` CLI is required. The local backend uses SQLite and the filesystem.

### 1. Start the backend

```bash
pnpm --filter worker run dev:local
```

The backend runs at **http://localhost:8787** and stores data in `apps/worker/local-storage/`.

### 2. Start the frontend

In a second terminal:

```bash
pnpm --filter web dev -- --host
```

### 3. Open the app

```text
http://localhost:4321
```

Go to `/add`, upload a photo or type a label, pick a shape, and release a fish.

---

## Run on a Cloud Machine / Server

You have two options for running in the cloud: the **local Node.js backend** (easiest) or the **Cloudflare Worker** stack.

### Option A — Node.js backend on any server

This uses the same code as local development and works on any VPS, container, or cloud VM.

1. Clone the repo and install dependencies:

   ```bash
   pnpm install
   ```

2. Build the frontend:

   ```bash
   pnpm --filter web build
   ```

3. Start the backend:

   ```bash
   pnpm --filter worker run start:local
   ```

4. Serve the contents of `apps/web/dist/` with any static file server (Nginx, Caddy, `npx serve`, etc.) and point it at your backend.

Set `PUBLIC_API_URL` in `apps/web/.env` if the backend is not on `http://localhost:8787`.

### Option B — Cloudflare Workers (serverless)

This uses Cloudflare's edge platform: D1 for the database, R2 for image storage, and KV for rate limiting.

1. Authenticate `wrangler`:

   ```bash
   wrangler login
   # or set CLOUDFLARE_API_TOKEN
   ```

2. Create the cloud resources:

   ```bash
   wrangler d1 create fishtank-db
   wrangler r2 bucket create fishtank-fish-images
   wrangler kv namespace create "fishtank-rate-limit"
   ```

3. Copy the returned IDs into `apps/worker/wrangler.toml`.

4. Apply the schema:

   ```bash
   wrangler d1 execute fishtank-db --file=apps/worker/src/db/schema.sql
   ```

5. Deploy the Worker:

   ```bash
   pnpm --filter worker run deploy
   ```

6. Configure the frontend:

   ```bash
   cp apps/web/.env.example apps/web/.env
   # set PUBLIC_API_URL to your deployed Worker URL
   ```

7. Build and deploy to Cloudflare Pages:

   ```bash
   pnpm --filter web build
   pnpm exec wrangler pages deploy apps/web/dist --project-name fishtank
   ```

Full details are in `docs/DEPLOYMENT.md`.

---

## Useful Commands

| Command | What it does |
|---|---|
| `pnpm install` | Install all workspace dependencies |
| `pnpm --filter worker test` | Run Worker route tests |
| `pnpm --filter web build` | Build the static frontend |
| `pnpm --filter worker run dev:local` | Run local Node backend |
| `pnpm --filter worker run start:local` | Run local Node backend (production-like) |
| `pnpm --filter worker run deploy` | Deploy Worker to Cloudflare |

---

## Debugging

- Check the backend terminal for errors if `localhost:8787` is not responding.
- Make sure ports `8787` and `4321` are free.
- Use browser DevTools **Network** tab to inspect `/api/fish` and `/api/upload/*` calls.
- If the PixiJS canvas stays black, look for WebGL errors in the console.

For more detail see `docs/getting-started.md`.

---

## Documentation

- `docs/getting-started.md` — install, run, debug, stack
- `docs/LOCAL.md` — local development without Wrangler
- `docs/DEPLOYMENT.md` — Cloudflare production deployment
- `docs/architecture-and-flow.md` — architecture, algorithms, and data flow
- `CHANGELOG-AUDIT.md` — every code change logged
