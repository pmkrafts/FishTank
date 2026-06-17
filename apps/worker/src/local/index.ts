import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import type { Env } from "../index.js";
import { fishRoutes } from "../routes/fish.js";
import { uploadRoutes } from "../routes/upload.js";
import { rateLimitRoutes } from "../routes/rate-limit.js";
import { localDb } from "./lib/db.js";
import { localBucket } from "./lib/bucket.js";
import { localKv } from "./lib/kv.js";

const app = new Hono<Env>();

app.use("*", cors({ origin: "*" }));

app.use("*", async (c, next) => {
  // Inject local implementations into the Worker-style bindings object.
  const bindings: Env["Bindings"] = {
    DB: localDb as unknown as Env["Bindings"]["DB"],
    BUCKET: localBucket as unknown as Env["Bindings"]["BUCKET"],
    KV: localKv as unknown as Env["Bindings"]["KV"],
  };
  Object.assign(c.env as unknown as Env["Bindings"], bindings);
  await next();
});

app.get("/", (c) => c.text("FishTank Local Server"));

app.route("/api/fish", fishRoutes);
app.route("/api/upload", uploadRoutes);
app.route("/api/rate-limit", rateLimitRoutes);

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port });

console.log(`FishTank local server running on http://localhost:${port}`);
