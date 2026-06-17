# Getting Started with FishTank

A quick-start guide for running and debugging the project locally.

---

## What You Need

- **Node.js** ≥ 24 (the local backend uses `node:sqlite`, which is built into Node 24+)
- **pnpm** ≥ 9
- A modern browser with WebGL support (for the PixiJS aquarium)

---

## Project Stack

| Layer | Tech |
|---|---|
| Monorepo / task runner | Turborepo + pnpm workspaces |
| Frontend framework | Astro 6 |
| UI islands | React 19 |
| Styling | Tailwind CSS 4 + custom `brutal.css` |
| Aquarium canvas | PixiJS v8 |
| Backend framework | Hono |
| Backend runtime | Cloudflare Workers (production) / Node.js (local dev) |
| Database | D1 (Cloudflare) / `node:sqlite` (local) |
| Object storage | R2 (Cloudflare) / filesystem (local) |
| Rate-limit store | KV (Cloudflare) / in-memory Map (local) |
| Visitor identity | FingerprintJS Pro (optional; falls back to anonymous UUID) |

---

## Install Dependencies

Open a terminal in `C:/MYProjects/SHowCase/Aquarium` and run:

```bash
pnpm install
```

> **Windows PowerShell users:** if you see an error about `pnpm.ps1` being blocked by execution policy, run:
>
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```
>
> Or use Command Prompt (`cmd.exe`) instead of PowerShell.

---

## Run the Project Locally (No Wrangler Needed)

FishTank can run entirely on your machine without a Cloudflare account.

### 1. Start the backend

```bash
pnpm --filter worker run dev:local
```

You should see:

```text
FishTank local server running on http://localhost:8787
```

The local backend stores data in:

- `apps/worker/local-storage/fishtank.sqlite`
- `apps/worker/local-storage/fish-images/`

These folders are created automatically and ignored by Git.

### 2. Start the frontend

In a **second terminal**:

```bash
pnpm --filter web dev -- --host
```

Open:

```text
http://localhost:4321
```

The `--host` flag makes the dev server reachable on `localhost` reliably.

### 3. Release a fish

- Go to **http://localhost:4321/add**
- Switch between **Upload Photo** and **Type Label**
- Pick a shape
- Click **Preview Fish**, then **Release Fish**
- Return to the home page and watch it swim

---

## Alternative: Run with Wrangler

If you have Cloudflare credentials and want the full Worker stack:

```bash
pnpm --filter worker dev
pnpm --filter web dev -- --host
```

This uses Wrangler's local D1/R2/KV emulators.

---

## Useful Commands

| Command | What it does |
|---|---|
| `pnpm install` | Install all workspace dependencies |
| `pnpm --filter worker test` | Run Worker route tests |
| `pnpm --filter web build` | Build the static frontend |
| `pnpm --filter worker run deploy` | Deploy the Worker to Cloudflare (requires auth) |

---

## Debugging Tips

### Backend not responding

- Make sure nothing else is using ports `8787` or `4321`.
- Check the backend terminal for startup errors.
- Try restarting the backend: it reuses the SQLite DB, so existing fish will reappear.

### Frontend can't reach the backend

- The web app defaults to `http://localhost:8787`.
- If you changed ports, update `apps/web/.env` and set `PUBLIC_API_URL`.

### Fish appears in count but not visually

- Open the browser DevTools **Network** tab.
- Look for `GET /api/fish` and image requests to `/api/upload/<key>`.
- If image requests fail, the backend storage may be empty or the key mismatched.

### PixiJS canvas stays black

- Check the browser console for WebGL errors.
- Try a different browser or disable hardware acceleration to rule out WebGL issues.

### PowerShell blocks pnpm

See the **Install Dependencies** section above.

---

## Where to Go Next

- `docs/LOCAL.md` — detailed local development guide
- `docs/DEPLOYMENT.md` — Cloudflare production deployment steps
- `docs/architecture-and-flow.md` — full architecture, algorithms, and data flow
