# Digital Aquarium Web App - Complete Project Guide

**Project Goal**: Build a fun shared aquarium where users upload a photo, apply a fish-shaped cookie-cutter mask, and add it as a swimming fish. Constraints: max 100 fish at once, 5-minute lifespan per fish, 1 fish per user every 4 hours.

---

## Recommended Tech Stack (Fully Free Cloudflare Tier)

### Core Framework & Monorepo
- **Framework**: Astro JS (with TypeScript + Tailwind CSS)
- **Monorepo Tool**: Turborepo + pnpm
- **Styling**: Tailwind CSS + DaisyUI / Shadcn-ui components

### Cloudflare Free Tier Services
| Component              | Tool                          | Free Tier Notes                          |
|------------------------|-------------------------------|------------------------------------------|
| Frontend               | Astro → Cloudflare Pages     | Unlimited bandwidth, generous builds    |
| Backend/API            | Cloudflare Workers           | 100k requests/day                       |
| Database (Fish State)  | Cloudflare D1 (SQLite)       | 5M reads, 100k writes/day               |
| Storage (Images)       | Cloudflare R2                | 10GB storage, generous operations       |
| Rate Limiting Store    | Cloudflare KV                | 1k writes/day sufficient                |
| Deployment             | wrangler CLI                 | Free                                    |

### Key Libraries

#### Visitor Identification & Rate Limiting
- `@fingerprintjs/fingerprintjs-pro` — Browser fingerprint for unique visitor ID (free tier for low volume)

#### Image Upload & Cookie-Cutter Masking
- Native Canvas API (`ctx.clip()`, `globalCompositeOperation`)
- **Recommended**: Fabric.js or Konva.js (for easier masking, previews)
- Preloaded 6-8 transparent PNG/SVG fish silhouette masks

#### Aquarium Rendering & Animation (100 fish)
- **PixiJS v8** (WebGL) — Best for performance, sprites, particles (bubbles, caustics)
- Alternatives: Three.js (if 3D needed), tsParticles for effects
- Physics: Custom simple movement or Matter.js (light)

#### State & Utils
- Nanostores or Jotai (lightweight)
- Comlink + Web Workers (for heavy image processing)
- Native File API + URL.createObjectURL

---

## Project Structure (Turborepo)

```bash
aquarium-app/
├── apps/
│   ├── web/                    # Astro frontend (Pages)
│   └── worker/                 # Cloudflare Worker backend
├── packages/
│   └── shared/                 # Types, utils, fish masks, constants
├── turbo.json
├── pnpm-workspace.yaml
├── wrangler.toml               # Shared config
└── package.json
```

---

## Key Features & Implementation Notes

1. **Upload Flow**
   - File input → Preview → "Scanning" animation
   - Cookie-cutter screen: Grid of fish shapes → Select → Mask image using Canvas/Fabric.js → Preview fish sprite

2. **Rate Limiting**
   - On frontend: Get fingerprint
   - Send to Worker → Check KV for last add timestamp (4 hours cooldown)

3. **Adding Fish**
   - Masked image uploaded to R2
   - Metadata stored in D1 (id, r2_key, created_at, fingerprint, position)
   - Max 100 active fish (query + cleanup old ones)

4. **Aquarium**
   - PixiJS Island in Astro
   - Poll/get fish list from Worker API
   - Each fish: Sprite with gentle swimming (sine wave movement, random turns, tail wiggle via rotation)
   - Auto-remove after 5 minutes (client + server cleanup)
   - Visuals: Water background, bubbles, seaweed, glass reflections

5. **Persistence**
   - D1 for active fish list
   - Cron job (free) in Worker for cleanup

---

## Deployment Instructions (Cloudflare Free)

1. Create Cloudflare account
2. Create D1 database, R2 bucket
3. Set up KV namespace
4. `wrangler deploy` for worker
5. `wrangler pages deploy` for Astro site
6. Bind D1, KV, R2 to Worker via `wrangler.toml`

**wrangler.toml example** (basic):
```toml
name = "aquarium-worker"
compatibility_date = "2026-06-01"

[[d1_databases]]
binding = "DB"
database_name = "aquarium-db"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "aquarium-fish-images"

[kv_namespaces]
binding = "KV"
id = "your-kv-id"
```

---

## D1 Schema (Example)

```sql
CREATE TABLE fish (
  id TEXT PRIMARY KEY,
  r2_key TEXT,
  fingerprint TEXT,
  created_at INTEGER,
  x REAL,
  y REAL,
  rotation REAL,
  shape_type TEXT
);
```

---

## Prompts for AI Code Generation

### Main Project Prompt
```
Create a Turborepo monorepo (Astro + TypeScript + Tailwind) for a shared digital Aquarium app, optimized for Cloudflare Free tier only.

Requirements:
- Astro frontend deployed to Cloudflare Pages.
- Cloudflare Worker backend with D1 for fish state and R2 for storing masked fish images.
- Use @fingerprintjs/fingerprintjs-pro for visitor identification.
- Upload photo → scanning animation → cookie-cutter with 8 fish shape masks (Canvas or Fabric.js) → save masked image to R2.
- Add fish to global aquarium (max 100 visible). Each fish lives exactly 5 minutes.
- Rate limit: 1 fish per visitor every 4 hours (store cooldown in KV).
- PixiJS island for smooth aquarium rendering with swimming fish (gentle physics, bubbles, caustics).
- Simple admin cleanup via Worker cron if needed.

Use only free-tier compatible services: D1, KV, R2, Workers, Pages. Include wrangler.toml, D1 schema, R2 bucket setup, and deployment instructions. Provide clean, commented code.
```

### Additional Prompts
- For PixiJS Aquarium Island: "Create a PixiJS v8 component for an aquarium with up to 100 swimming fish sprites..."
- For Masking Logic: "Implement fish cookie-cutter masking using Fabric.js or Canvas..."

---

## Next Steps
1. Initialize Turborepo: `npx create-turbo@latest aquarium-app`
2. Add Astro app and Worker
3. Set up Cloudflare resources
4. Implement core upload + masking first (MVP)
5. Then add PixiJS aquarium

**Total Estimated Cost**: $0 on free tier for moderate usage.

Let me know if you need individual code files generated or help with any part!
```

**File Created Successfully**: `aquarium-project-documentation.md`

You can now download/view this file for the complete consolidated documentation. 🐟

If you need any modifications or additional sections, just tell me!