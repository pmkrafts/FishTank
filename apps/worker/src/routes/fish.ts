import { Hono } from "hono";
import type { Env } from "../index.js";
import { ensureSchema } from "../lib/db.js";
import { MAX_FISH, FISH_LIFESPAN_MS } from "@fishtank/shared";

export const fishRoutes = new Hono<Env>();

fishRoutes.get("/", async (c) => {
  await ensureSchema(c.env.DB);
  const now = Date.now();
  const { results } = await c.env.DB.prepare(
    `SELECT id, r2_key as r2Key, fingerprint, created_at as createdAt, expires_at as expiresAt,
            x, y, rotation, shape_type as shapeType, text_label as textLabel, text_color as textColor
     FROM fish
     WHERE expires_at > ?
     ORDER BY created_at DESC
     LIMIT ?`
  )
    .bind(now, MAX_FISH)
    .all();

  return c.json({ fish: results ?? [] });
});

fishRoutes.get("/:id", async (c) => {
  await ensureSchema(c.env.DB);
  const id = c.req.param("id");
  const row = await c.env.DB.prepare(
    `SELECT id, r2_key as r2Key, fingerprint, created_at as createdAt, expires_at as expiresAt,
            x, y, rotation, shape_type as shapeType, text_label as textLabel, text_color as textColor
     FROM fish
     WHERE id = ?`
  )
    .bind(id)
    .first();

  if (!row) return c.notFound();
  return c.json(row);
});

fishRoutes.delete("/expired", async (c) => {
  await ensureSchema(c.env.DB);
  const now = Date.now();
  const { meta } = await c.env.DB.prepare(
    `DELETE FROM fish WHERE expires_at <= ?`
  )
    .bind(now)
    .run();

  return c.json({ deleted: meta.rows_written ?? 0 });
});

fishRoutes.post("/", async (c) => {
  await ensureSchema(c.env.DB);
  const body = await c.req.json<{ r2Key: string; fingerprint: string; shapeType: string; textLabel?: string; textColor?: string }>();

  if (!body.r2Key || !body.fingerprint || !body.shapeType) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  const cooldownKey = `cooldown:${body.fingerprint}`;
  const lastAdded = await c.env.KV.get(cooldownKey);
  if (lastAdded) {
    const last = parseInt(lastAdded, 10);
    const remaining = Math.max(0, Math.ceil((last + 4 * 60 * 60 * 1000 - Date.now()) / 1000));
    return c.json({ error: "Rate limited", remainingSeconds: remaining }, 429);
  }

  const { results } = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM fish WHERE expires_at > ?`
  )
    .bind(Date.now())
    .all<{ count: number }>();

  const activeCount = results?.[0]?.count ?? 0;
  if (activeCount >= MAX_FISH) {
    return c.json({ error: "Aquarium is full" }, 503);
  }

  const id = crypto.randomUUID();
  const createdAt = Date.now();
  const expiresAt = createdAt + FISH_LIFESPAN_MS;

  await c.env.DB.prepare(
    `INSERT INTO fish (id, r2_key, fingerprint, created_at, expires_at, shape_type, text_label, text_color, x, y, rotation)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, body.r2Key, body.fingerprint, createdAt, expiresAt, body.shapeType, body.textLabel ?? null, body.textColor ?? null, 0.5, 0.5, 0)
    .run();

  await c.env.KV.put(cooldownKey, String(createdAt), { expirationTtl: 4 * 60 * 60 });

  return c.json({ id, createdAt, expiresAt }, 201);
});
