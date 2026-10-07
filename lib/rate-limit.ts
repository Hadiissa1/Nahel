import "server-only";
import { headers } from "next/headers";

/** Best-effort client IP (behind a proxy, set by it in X-Forwarded-For). */
export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/**
 * Fixed-window counter, per server process. `hit(key)` records an attempt and
 * returns false once `max` attempts were made within `windowMs`.
 */
export function rateLimiter(max: number, windowMs: number) {
  const hits = new Map<string, { count: number; first: number }>();
  return function hit(key: string): boolean {
    const now = Date.now();
    const h = hits.get(key);
    if (!h || now - h.first > windowMs) {
      if (hits.size > 10_000) hits.clear(); // bound memory
      hits.set(key, { count: 1, first: now });
      return true;
    }
    h.count++;
    return h.count <= max;
  };
}
