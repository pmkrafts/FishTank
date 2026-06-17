import { describe, it, expect } from "vitest";
import { SELF } from "cloudflare:test";

describe("Fish routes", () => {
  it("GET /api/fish returns an empty array", async () => {
    const res = await SELF.fetch("http://localhost/api/fish");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.fish).toEqual([]);
  });

  it("POST /api/fish rejects missing fields", async () => {
    const res = await SELF.fetch("http://localhost/api/fish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("POST /api/fish creates a fish and enforces cooldown", async () => {
    const payload = {
      r2Key: "test-key.png",
      fingerprint: "fp-test-1",
      shapeType: "classic",
    };

    const res1 = await SELF.fetch("http://localhost/api/fish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    expect(res1.status).toBe(201);
    const body1 = await res1.json();
    expect(body1.id).toBeDefined();

    const res2 = await SELF.fetch("http://localhost/api/fish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    expect(res2.status).toBe(429);
    const body2 = await res2.json();
    expect(body2.remainingSeconds).toBeGreaterThan(0);
  });
});
