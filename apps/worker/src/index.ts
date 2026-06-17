import { Hono } from "hono";
import { cors } from "hono/cors";
import { fishRoutes } from "./routes/fish.js";
import { uploadRoutes } from "./routes/upload.js";
import { rateLimitRoutes } from "./routes/rate-limit.js";

export type Env = {
  Bindings: {
    DB: D1Database;
    BUCKET: R2Bucket;
    KV: KVNamespace;
  };
};

const app = new Hono<Env>();

app.use("*", cors({ origin: "*" }));

app.get("/", (c) => c.text("FishTank Worker"));

app.onError((err, c) => {
  const message = err instanceof Error ? err.message : "Internal server error";
  return c.json({ error: message }, 500);
});
app.route("/api/fish", fishRoutes);
app.route("/api/upload", uploadRoutes);
app.route("/api/rate-limit", rateLimitRoutes);

export default app;
