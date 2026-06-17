# DIGITAL AQUARIUM — EXECUTION PLAN
## Brutalist Design Edition

---

## 1. DESIGN DIRECTIVE: BRUTALISM

The aquarium rejects glass-morphism, gradients, and soft UI. The interface is built like a concrete tank: exposed structure, high contrast, raw edges, system-first typography.

### Visual Rules
- **Palette**: Pure black `#000000`, off-white `#F4F4F0`, signal red `#FF2D00`, electric blue `#0055FF`, concrete gray `#BDBDBD`.
- **Typography**: System monospace stack only — `font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`.
- **Borders**: 3px–6px solid black borders on every container, button, input, and card. No border-radius.
- **Shadows**: None. Use offset borders or negative-space outlines instead.
- **Buttons**: Black fill, white text, 4px border, uppercase labels, active state inverts to white fill / black text.
- **Layout**: CSS Grid with visible gutters. No centered hero. Asymmetric margins allowed.
- **Aquarium Canvas**: Full-bleed rectangle with a thick black frame. Water is flat `#0055FF` or `#000000` background. Fish are raw clipped sprites. Bubbles are white circles with black outlines.

### Component Language
| Element | Treatment |
|---|---|
| Header | Black bar, white monospace title, no logo |
| Upload zone | Dashed 4px black border, `#F4F4F0` fill, uppercase instruction |
| Text fish panel | White card, 4px black border, monospace input, flat color swatches, black preview box |

---

## 2. ARCHITECTURE

```
aquarium-app/
├── apps/
│   ├── web/                 # Astro + TypeScript + Tailwind
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── AquariumCanvas.tsx      # PixiJS island
│   │   │   │   ├── UploadPipeline.tsx      # file → scan → mask → submit
│   │   │   │   ├── FishMaskSelector.tsx    # 8 brutalist shape tiles
│   │   │   │   ├── FishCard.tsx            # metadata display
│   │   │   │   ├── TextFishGenerator.tsx   # text + color → masked sprite
│   │   │   │   └── RateLimitBanner.tsx     # cooldown indicator
│   │   │   ├── layouts/
│   │   │   │   └── BrutalLayout.astro      # global frame + nav
│   │   │   ├── pages/
│   │   │   │   ├── index.astro             # aquarium view
│   │   │   │   └── add.astro               # upload flow
│   │   │   ├── styles/
│   │   │   │   └── brutal.css              # design tokens + utilities
│   │   │   └── stores/
│   │   │       └── fishStore.ts            # nanostores
│   │   └── astro.config.mjs
│   └── worker/              # Cloudflare Worker (Hono or pure fetch)
│       ├── src/
│       │   ├── index.ts
│       │   ├── routes/
│       │   │   ├── fish.ts
│       │   │   └── upload.ts
│       │   ├── db/
│       │   │   └── schema.sql
│       │   └── lib/
│       │       ├── r2.ts
│       │       ├── kv.ts
│       │       └── mask.ts
│       └── wrangler.toml
├── packages/
│   └── shared/
│       ├── types.ts
│       ├── constants.ts      # MAX_FISH, LIFESPAN_MS, COOLDOWN_MS
│       └── masks/            # 8 SVG silhouette masks
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## 3. PHASE PLAN

### PHASE 0 — REPO & TOOLING
**Goal**: Working monorepo skeleton with two apps.

- [ ] `npx create-turbo@latest aquarium-app` with `pnpm`.
- [ ] Add `apps/web` as Astro project (`npm create astro@latest apps/web -- --template minimal --typescript --tailwind`).
- [ ] Add `apps/worker` as Cloudflare Worker (`npm create cloudflare@latest apps/worker -- --type hello-world`).
- [ ] Add `packages/shared` with `package.json` and export types/constants.
- [ ] Wire `turbo.json` and `pnpm-workspace.yaml`.
- [ ] Install shared dev deps: `typescript`, `vitest`.
- [ ] Commit: `chore: init turborepo + astro + worker`.

**Deliverable**: `pnpm dev` starts Astro; `pnpm dev:worker` starts local Worker.

---

### PHASE 1 — BRUTALIST DESIGN SYSTEM
**Goal**: Reusable tokens, layout, and components in the web app.

- [ ] Create `apps/web/src/styles/brutal.css` with CSS variables:
  - `--bg: #F4F4F0`
  - `--ink: #000000`
  - `--accent: #FF2D00`
  - `--water: #0055FF`
  - `--mute: #BDBDBD`
  - `--border: 4px solid var(--ink)`
  - `--font: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`
- [ ] Build `BrutalLayout.astro` with black header, white monospace logo "AQUARIUM", raw nav links.
- [ ] Build atomic components: `BrutalButton`, `BrutalBox`, `BrutalInput`, `BrutalAlert`.
- [ ] Add a temporary `/design` page showcasing all components for review.
- [ ] Ensure no border-radius anywhere. Validate with a custom stylelint rule or manual audit.

**Deliverable**: `/design` renders the full component kit with brutalist styling.

---

### PHASE 2 — DATA & STORAGE (BACKEND)
**Goal**: D1, R2, KV bound and operational locally.

- [ ] Write `apps/worker/src/db/schema.sql`:
  ```sql
  CREATE TABLE fish (
    id TEXT PRIMARY KEY,
    r2_key TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    x REAL DEFAULT 0.5,
    y REAL DEFAULT 0.5,
    rotation REAL DEFAULT 0,
    shape_type TEXT NOT NULL,
    text_label TEXT,           -- optional: text used instead of photo
    text_color TEXT            -- optional: hex color for text fish
  );
  CREATE INDEX idx_fish_expires ON fish(expires_at);
  CREATE INDEX idx_fish_fingerprint ON fish(fingerprint);
  ```
- [ ] Configure `wrangler.toml` with D1, R2, KV bindings for local and prod.
- [ ] Implement `GET /api/fish` — returns active fish (expires_at > now), max 100, ordered by created_at DESC.
- [ ] Implement `POST /api/fish` — accepts masked image + metadata, validates cooldown via KV, enforces max count, writes to R2 + D1.
- [ ] Implement `DELETE /api/fish/expired` cron/hand route for cleanup.
- [ ] Implement `GET /api/rate-limit?fp=` returning seconds remaining.
- [ ] Add Vitest tests for Worker routes with Miniflare bindings.

**Deliverable**: Local Worker API passes Postman/HTTPie checks for list, add, and rate-limit.

---

### PHASE 3 — UPLOAD & MASKING PIPELINE
**Goal**: User can upload a photo OR type text + pick a color, pick a mask, preview the fish, and submit.

- [ ] Add 8 SVG fish silhouette masks to `packages/shared/masks/` (e.g., `classic.svg`, `puffer.svg`, `shark.svg`, `ray.svg`, `angelfish.svg`, `blob.svg`, `long.svg`, `round.svg`).
- [ ] Build `UploadPipeline.tsx` with two modes selected via brutalist toggle:
  - **PHOTO MODE**
    1. File input with validation (image, max 5MB).
    2. Preview source image.
    3. "SCANNING" brute-loader animation.
    4. `FishMaskSelector` grid of 8 shape tiles.
    5. Canvas-based masking: draw user image through SVG clip path into a square sprite PNG.
  - **TEXT MODE**
    1. Monospace text input (max 12 chars) for the fish label.
    2. Brutalist color picker: flat swatches (red, blue, yellow, green, black, white) + native color input fallback.
    3. `FishMaskSelector` grid of 8 shape tiles.
    4. Canvas-based masking: render uppercase text centered inside the mask shape, then clip to silhouette.
  - Shared final steps:
    6. Preview masked fish.
    7. Submit generated sprite to Worker with fingerprint.
- [ ] Use native Canvas API; keep Fabric.js as fallback only if masking precision fails.
- [ ] Display upload progress / errors in `BrutalAlert`.
- [ ] Integrate `@fingerprintjs/fingerprintjs-pro` to generate visitor ID.

**Deliverable**: User flow from `/add` produces a masked sprite (from photo or text) and persists it in R2/D1.

---

### PHASE 4 — AQUARIUM CANVAS
**Goal**: PixiJS island rendering up to 100 fish with brutalist visuals.

- [ ] Install PixiJS v8 in `apps/web`.
- [ ] Build `AquariumCanvas.tsx`:
  - Pixi Application with black background or flat blue.
  - Load fish textures from R2 public URLs.
  - Each fish = `PIXI.Sprite`; flip/rotate toward velocity.
  - Movement: simple sine-wave + random turn + edge wrap.
  - Bubbles as white circle graphics rising upward.
  - Caustics as raw diagonal line graphics or flat shader, no gradients.
- [ ] Poll `/api/fish` every 15 seconds; reconcile sprites (add/remove).
- [ ] Client-side expiry: remove fish when `expires_at` reached.
- [ ] Add stats overlay: `FISH COUNT: 087 / 100`, `NEXT CLEANUP: 00:03:12`, brutalist raw text.

**Deliverable**: `/` displays a living aquarium with all persisted fish swimming.

---

### PHASE 5 — RATE LIMITING & COOLDOWN UI
**Goal**: Enforce 1 fish per visitor per 4 hours with clear feedback.

- [ ] KV key format: `cooldown:<fingerprint>` with TTL of 4 hours.
- [ ] On `/add` load, fetch `/api/rate-limit?fp=...`.
  - If active: show red `BrutalAlert` with remaining time and disable submit.
  - If inactive: show blue alert "YOU MAY RELEASE ONE FISH".
- [ ] Worker rejects duplicate submissions within cooldown with `429` and remaining seconds.
- [ ] Display cooldown banner on `/` as well.

**Deliverable**: Cooldown state is enforced and surfaced across both pages.

---

### PHASE 6 — DEPLOYMENT
**Goal**: Live production app on Cloudflare free tier.

- [ ] Create Cloudflare account / use existing.
- [ ] Create D1 database, run schema.
- [ ] Create R2 bucket `aquarium-fish-images`.
- [ ] Create KV namespace `aquarium-rate-limit`.
- [ ] Update `wrangler.toml` with production IDs.
- [ ] Add GitHub Actions workflow (optional but recommended):
  - Deploy Worker on push to `main`.
  - Deploy Pages on push to `main`.
- [ ] Run `wrangler deploy` for Worker.
- [ ] Run `wrangler pages deploy` for Astro site.
- [ ] Bind D1/R2/KV to Worker in Cloudflare dashboard.
- [ ] Smoke-test production upload → render → expiry flow end to end.

**Deliverable**: Public URL serving the aquarium with full feature loop.

---

## 4. EXECUTION ORDER

```
PHASE 0 → PHASE 1 → PHASE 2 → PHASE 3 → PHASE 4 → PHASE 5 → PHASE 6
```

PHASE 1 can overlap with PHASE 2 once the layout skeleton exists.
PHASE 3 and PHASE 4 can be developed in parallel after PHASE 2.

---

## 5. RISKS & MITIGATIONS

| Risk | Mitigation |
|---|---|
| FingerprintJS Pro free tier exceeded | Fallback to `visitorId` hash from canvas + IP + user-agent; treat as best-effort |
| PixiJS performance on low-end devices | Cap at 100 fish, use sprite pooling, reduce bubbles on `prefers-reduced-motion` |
| R2 egress / hotlinking | Set R2 bucket public but add `Cache-Control: max-age=300`; Worker can proxy if needed |
| D1 write limits on viral traffic | Add client-side debounce; Worker returns `503` if write quota throttled |
| Brutalist design feels hostile | Keep CTAs oversized and high-contrast; never hide critical status behind styling |

---

## 6. ACCEPTANCE CRITERIA

- [ ] A visitor can upload one photo every 4 hours.
- [ ] A visitor can type text + color instead of uploading a photo.
- [ ] Each uploaded fish appears in the global aquarium within 15 seconds.
- [ ] Fish automatically disappear after 5 minutes.
- [ ] Maximum 100 fish are visible at once.
- [ ] The UI uses only brutalist styling: no border-radius, no gradients, no soft shadows, monospace type.
- [ ] The app runs entirely on Cloudflare free tier (Pages, Workers, D1, R2, KV).
- [ ] All code is TypeScript; Worker routes have unit tests.
---

## 7. NEXT IMMEDIATE ACTION

Run **PHASE 0** commands to initialize the monorepo, then commit and proceed to **PHASE 1** design tokens.
