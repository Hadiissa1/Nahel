import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { db } from "@/lib/db";

/**
 * Best-effort client IP. On Cloudflare, CF-Connecting-IP is set by Cloudflare
 * itself; elsewhere (local, other proxies) X-Forwarded-For is used.
 */
export async function clientIp() {
  const h = await headers();
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Fixed-window counter stored in the database, so the limit holds across all
 * servers (on Cloudflare every request may run on a different one). Keys are
 * hashed: no IP address is stored.
 */
export function rateLimiter(name: string, max: number, windowMs: number) {
  const keyOf = (key: string) => `${name}:${createHash("sha256").update(key).digest("base64url").slice(0, 22)}`;
  const windowStart = () => Date.now() - (Date.now() % windowMs);

  /** Records an attempt; false once `max` attempts were made in the current window. */
  async function hit(key: string): Promise<boolean> {
    const row = (await db()
      .prepare(
        `INSERT INTO rate_hits (key, window_start, count) VALUES (?, ?, 1)
         ON CONFLICT(key) DO UPDATE SET
           count = CASE WHEN window_start = excluded.window_start THEN count + 1 ELSE 1 END,
           window_start = excluded.window_start
         RETURNING count`,
      )
      .get(keyOf(key), windowStart())) as { count: number };
    // Now and then, forget finished windows (keeps the table small).
    if (Math.random() < 0.01) {
      await db().prepare("DELETE FROM rate_hits WHERE window_start < ?").run(Date.now() - 2 * 86_400_000);
    }
    return row.count <= max;
  }

  /** True when `max` attempts were already made in the current window (records nothing). */
  async function exhausted(key: string): Promise<boolean> {
    const row = (await db()
      .prepare("SELECT count FROM rate_hits WHERE key = ? AND window_start = ?")
      .get(keyOf(key), windowStart())) as { count: number } | undefined;
    return (row?.count ?? 0) >= max;
  }

  async function reset(key: string) {
    await db().prepare("DELETE FROM rate_hits WHERE key = ?").run(keyOf(key));
  }

  return { hit, exhausted, reset };
}

/**
 * Same idea kept in this server's memory only: no database write, but each
 * server counts on its own. For high-volume, low-stakes counters (page views).
 */
export function memoryRateLimiter(max: number, windowMs: number) {
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
