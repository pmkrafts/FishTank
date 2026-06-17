import { useEffect, useState } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs-pro";
import { FINGERPRINT_API_KEY, API_URL } from "../lib/env.js";
import { BrutalAlert } from "./BrutalAlert";

export function RateLimitBanner() {
  const [rateLimit, setRateLimit] = useState<{ allowed: boolean; remainingSeconds: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    FingerprintJS.load({ apiKey: FINGERPRINT_API_KEY })
      .then((fp) => fp.get())
      .then((result) => fetch(`${API_URL}/api/rate-limit?fp=${encodeURIComponent(result.visitorId)}`))
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setRateLimit(data);
      })
      .catch((err) => {
        if (!cancelled) console.error("Rate limit check failed", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!rateLimit || rateLimit.allowed) return null;

  return (
    <BrutalAlert variant="red">
      <p style={{ margin: 0, fontWeight: 700 }}>
        COOLDOWN ACTIVE — {Math.ceil(rateLimit.remainingSeconds / 60)} MINUTES UNTIL YOU CAN RELEASE ANOTHER FISH
      </p>
    </BrutalAlert>
  );
}
