import { Hono } from "hono";
import type { Env } from "../index.js";

export const rateLimitRoutes = new Hono<Env>();

rateLimitRoutes.get("/", async (c) => {
  const fingerprint = c.req.query("fp");
  if (!fingerprint) return c.json({ error: "Missing fingerprint" }, 400);

  const cooldownKey = `cooldown:${fingerprint}`;
  const lastAdded = await c.env.KV.get(cooldownKey);
  const now = Date.now();

  let remainingSeconds = 0;
  if (lastAdded) {
    const last = parseInt(lastAdded, 10);
    remainingSeconds = Math.max(0, Math.ceil((last + 4 * 60 * 60 * 1000 - now) / 1000));
  }

  return c.json({ allowed: remainingSeconds === 0, remainingSeconds });
});
