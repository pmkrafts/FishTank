# Deployment Guide

## Prerequisites

- A Cloudflare account.
- `wrangler` CLI authenticated (`wrangler login` or `CLOUDFLARE_API_TOKEN`).
- A FingerprintJS Pro API key (optional; the app falls back to anonymous visitor IDs).

## 1. Create Cloudflare Resources

```bash
# D1 database
wrangler d1 create fishtank-db

# R2 bucket
wrangler r2 bucket create fishtank-fish-images

# KV namespace
wrangler kv namespace create "fishtank-rate-limit"
```

## 2. Update Worker Configuration

Copy `apps/worker/wrangler.toml` and replace the placeholder IDs with the real IDs returned above.

```toml
name = "fishtank-worker"
main = "src/index.ts"
compatibility_date = "2025-09-06"

[[d1_databases]]
binding = "DB"
database_name = "fishtank-db"
database_id = "<YOUR_D1_DATABASE_ID>"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "fishtank-fish-images"

[[kv_namespaces]]
binding = "KV"
id = "<YOUR_KV_NAMESPACE_ID>"
```

Apply the D1 schema:

```bash
wrangler d1 execute fishtank-db --file=apps/worker/src/db/schema.sql
```

## 3. Deploy the Worker

```bash
pnpm --filter worker run deploy
```

## 4. Configure the Web App

Create `apps/web/.env` from `.env.example` and point `PUBLIC_API_URL` to your deployed Worker URL.

```bash
cp apps/web/.env.example apps/web/.env
# Edit apps/web/.env
```

## 5. Build and Deploy Pages

```bash
pnpm --filter web build
pnpm exec wrangler pages deploy apps/web/dist --project-name fishtank
```

## Notes

- The current environment does not have a Cloudflare API token, so the actual deploy step was not executed.
- Once the token is available, the commands above will publish the project to Cloudflare Pages and Workers.
