import { Hono } from "hono";
import type { Env } from "../index.js";

export const uploadRoutes = new Hono<Env>();

uploadRoutes.post("/presigned", async (c) => {
  const { key } = await c.req.json<{ key?: string }>();
  if (!key) return c.json({ error: "Missing key" }, 400);

  const object = await c.env.BUCKET.head(key);
  if (object) {
    return c.json({ error: "Key already exists" }, 409);
  }

  return c.json({ key });
});

uploadRoutes.post("/", async (c) => {
  const contentType = c.req.header("content-type") ?? "image/png";
  const key = c.req.query("key");
  if (!key) return c.json({ error: "Missing key" }, 400);

  const body = await c.req.arrayBuffer();
  if (body.byteLength === 0) return c.json({ error: "Empty body" }, 400);

  await c.env.BUCKET.put(key, body, {
    httpMetadata: { contentType },
    customMetadata: { source: "fishtank-upload" },
  });

  return c.json({ key, size: body.byteLength }, 201);
});

uploadRoutes.get("/:key", async (c) => {
  const key = c.req.param("key");
  const object = await c.env.BUCKET.get(key);
  if (!object) return c.notFound();

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Content-Type", object.httpMetadata?.contentType ?? "image/png");
  headers.set("Cache-Control", "public, max-age=300");

  return new Response(object.body, { headers });
});
