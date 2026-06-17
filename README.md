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

## Quick Start

### Requirements

- Node.js ≥ 24
- pnpm

### Install

```bash
pnpm install
```

> **Windows PowerShell:** if `pnpm` is blocked by execution policy, run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` or use `cmd.exe`.

### Run locally (no Wrangler / Cloudflare account needed)

Terminal 1 — backend:

```bash
pnpm --filter worker run dev:local
```

Terminal 2 — frontend:

```bash
pnpm --filter web dev -- --host
```

Open **http://localhost:4321**.

---

## Useful Commands

```bash
pnpm --filter worker test          # Worker tests
pnpm --filter web build            # Production build
pnpm --filter worker run deploy    # Deploy Worker to Cloudflare (requires auth)
```

---

## Debugging

- Check backend logs if `localhost:8787` is not responding.
- Verify ports `8787` and `4321` are free.
- Use browser DevTools Network tab to inspect `/api/fish` and `/api/upload/*` calls.
- If the PixiJS canvas stays black, look for WebGL errors in the console.

For more detail see `docs/getting-started.md`.

---

## Documentation

- `docs/getting-started.md` — install, run, debug, stack
- `docs/LOCAL.md` — local development without Wrangler
- `docs/DEPLOYMENT.md` — Cloudflare production deployment
- `docs/architecture-and-flow.md` — architecture, algorithms, and data flow
- `CHANGELOG-AUDIT.md` — every code change logged
