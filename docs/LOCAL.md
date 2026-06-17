# Local Development Guide

No Cloudflare account or `wrangler` CLI is required. The backend runs as a plain Node.js server using SQLite and the filesystem.

## Requirements

- Node.js ≥ 24 (provides `node:sqlite`)
- pnpm

## Install dependencies

```bash
pnpm install
```

## Run the backend locally

```bash
pnpm --filter worker run dev:local
```

The local backend starts on **http://localhost:8787** and uses:

- `apps/worker/local-storage/fishtank.sqlite` for the database
- `apps/worker/local-storage/fish-images/` for uploaded fish images
- an in-memory map for rate-limit cooldowns

The schema is created automatically on the first request.

## Run the frontend locally

In another terminal:

```bash
pnpm --filter web dev -- --host
```

Open **http://localhost:4321**.

The `--host` flag binds the dev server to all interfaces so the browser can reach it reliably on `localhost`.

## Run tests

```bash
pnpm --filter worker test
```

## Notes

- `PUBLIC_API_URL` does not need to be set locally; the web app defaults to `http://localhost:8787`.
- FingerprintJS Pro is optional. If no `PUBLIC_FINGERPRINT_API_KEY` is set, the app falls back to anonymous visitor IDs.
- Uploaded fish images and the SQLite DB persist across restarts in `apps/worker/local-storage/`.
