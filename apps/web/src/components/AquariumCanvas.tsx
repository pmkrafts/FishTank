import { useEffect, useRef, useState } from "react";
import { Application, Sprite, Graphics, Texture } from "pixi.js";
import { API_URL } from "../lib/env.js";
import { FISH_POLL_INTERVAL_MS, FISH_LIFESPAN_MS, MAX_FISH, type Fish } from "@fishtank/shared";

const BUBBLE_COUNT = 20;

interface FishSprite {
  id: string;
  sprite: Sprite;
  vx: number;
  vy: number;
  wobble: number;
  expiresAt: number;
}

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function loadTexture(url: string): Promise<Texture> {
  const { promise, resolve, reject } = Promise.withResolvers<Texture>();
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.onload = () => {
    try {
      resolve(Texture.from(image));
    } catch (err) {
      reject(err);
    }
  };
  image.onerror = reject;
  image.src = url;
  return promise;
}

export function AquariumCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const fishMapRef = useRef<Map<string, FishSprite>>(new Map());
  const [stats, setStats] = useState({ count: 0, nextCleanup: FISH_LIFESPAN_MS });

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    const init = async () => {
      const app = new Application();
      await app.init({
        background: "#000000",
        resizeTo: containerRef.current!,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });
      if (cancelled) {
        app.destroy(true);
        return;
      }
      containerRef.current!.appendChild(app.canvas);
      appRef.current = app;

      const bubbles = new Graphics();
      app.stage.addChild(bubbles);

      const bubbleData = Array.from({ length: BUBBLE_COUNT }, () => ({
        x: Math.random() * app.screen.width,
        y: Math.random() * app.screen.height,
        r: 2 + Math.random() * 6,
        speed: 0.5 + Math.random() * 1.5,
      }));

      app.ticker.add(() => {
        bubbles.clear();
        for (const b of bubbleData) {
          b.y -= b.speed;
          if (b.y + b.r < 0) {
            b.y = app.screen.height + b.r;
            b.x = Math.random() * app.screen.width;
          }
          bubbles.circle(b.x, b.y, b.r);
        }
        bubbles.stroke({ width: 2, color: 0xffffff });

        const now = Date.now();
        for (const [id, f] of fishMapRef.current) {
          if (now >= f.expiresAt) {
            app.stage.removeChild(f.sprite);
            f.sprite.destroy();
            fishMapRef.current.delete(id);
            continue;
          }
          const sprite = f.sprite;
          sprite.x += f.vx;
          sprite.y += f.vy + Math.sin((now / 1000) * 2 + f.wobble) * 0.3;
          sprite.rotation = Math.atan2(f.vy, f.vx) * 0.2;

          if (sprite.x < -sprite.width) sprite.x = app.screen.width + sprite.width;
          if (sprite.x > app.screen.width + sprite.width) sprite.x = -sprite.width;
          if (sprite.y < -sprite.height) sprite.y = app.screen.height + sprite.height;
          if (sprite.y > app.screen.height + sprite.height) sprite.y = -sprite.height;

          sprite.scale.x = f.vx > 0 ? Math.abs(sprite.scale.x) : -Math.abs(sprite.scale.x);
        }

        let minRemaining = FISH_LIFESPAN_MS;
        for (const f of fishMapRef.current.values()) {
          const remaining = f.expiresAt - now;
          if (remaining < minRemaining) minRemaining = remaining;
        }
        setStats({ count: fishMapRef.current.size, nextCleanup: minRemaining });
      });

      const syncFish = async () => {
        try {
          const res = await fetch(`${API_URL}/api/fish`);
          const data = await res.json<{ fish: Fish[] }>();
          const fishList: Fish[] = data.fish ?? [];
          const now = Date.now();

          const existing = new Set(fishMapRef.current.keys());
          for (const fish of fishList) {
            if (fishMapRef.current.has(fish.id)) {
              existing.delete(fish.id);
              continue;
            }
            const texture = await loadTexture(`${API_URL}/api/upload/${encodeURIComponent(fish.r2Key)}`);
            const sprite = new Sprite(texture);
            sprite.anchor.set(0.5);
            const scale = ((0.08 + Math.random() * 0.06) * app.screen.width) / Math.max(sprite.width, sprite.height);
            sprite.scale.set(scale);
            sprite.x = (fish.x * app.screen.width) || Math.random() * app.screen.width;
            sprite.y = (fish.y * app.screen.height) || Math.random() * app.screen.height;
            sprite.rotation = fish.rotation || 0;
            app.stage.addChild(sprite);

            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 1.2;
            fishMapRef.current.set(fish.id, {
              id: fish.id,
              sprite,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              wobble: Math.random() * 10,
              expiresAt: fish.expiresAt,
            });
          }

          for (const id of existing) {
            const f = fishMapRef.current.get(id);
            if (f) {
              app.stage.removeChild(f.sprite);
              f.sprite.destroy();
              fishMapRef.current.delete(id);
            }
          }
        } catch (err) {
          console.error("Failed to sync fish", err);
        }
      };

      await syncFish();
      const interval = setInterval(syncFish, FISH_POLL_INTERVAL_MS);

      return () => {
        clearInterval(interval);
      };
    };

    const cleanupPromise = init();

    return () => {
      cancelled = true;
      cleanupPromise.then((cleanup) => cleanup?.()).catch(() => {});
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
      fishMapRef.current.clear();
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "60vh", minHeight: 400 }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          background: "var(--bg)",
          border: "4px solid var(--ink)",
          padding: "0.5rem 0.75rem",
          fontSize: "0.75rem",
          fontWeight: 700,
          textTransform: "uppercase",
        }}
      >
        Fish: {stats.count.toString().padStart(3, "0")} / {MAX_FISH}
      </div>
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          background: "var(--bg)",
          border: "4px solid var(--ink)",
          padding: "0.5rem 0.75rem",
          fontSize: "0.75rem",
          fontWeight: 700,
          textTransform: "uppercase",
        }}
      >
        Next cleanup: {formatTime(stats.nextCleanup)}
      </div>
    </div>
  );
}
