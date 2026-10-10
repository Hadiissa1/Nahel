import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { Statement, db } from "@/lib/db";
import { shopDay } from "@/lib/shop-time";

/**
 * Privacy-friendly visit counting: no cookie, no IP address stored.
 * A visitor is a hash of (secret of the day + IP + browser); the secret is
 * random, changes every day and older ones are deleted, so nobody can be
 * recognised from one day to the next.
 */

const BOT_RE = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|whatsapp|curl|wget|python|axios|node-fetch|go-http/i;

/** Only shop pages are counted; lot numbers are grouped (they identify a jar). */
export function normalizePath(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length > 200 || !raw.startsWith("/")) return null;
  const path = raw.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (path.startsWith("/admin") || path.startsWith("/api") || path.startsWith("/_next")) return null;
  if (path.startsWith("/lot/")) return "/lot/*";
  if (!/^\/(product|blog)(\/[\w%.-]{1,100})?$|^\/(lot|offers\/[a-z-]+)?$/.test(path)) return null;
  return path;
}

// Secret of the day, remembered by each server (read from the database once a day).
let saltCache: { day: string; value: string } | null = null;

async function salt(day: string): Promise<string> {
  if (saltCache?.day === day) return saltCache.value;
  const key = `visit_salt_${day}`;
  const [, row] = await db().batch([
    new Statement("INSERT OR IGNORE INTO meta (key, value) VALUES (?, ?)", [key, randomBytes(16).toString("hex")]),
    new Statement("SELECT value FROM meta WHERE key = ?", [key]),
    // Forget older secrets: yesterday's visitors can't be linked to today's.
    new Statement("DELETE FROM meta WHERE key LIKE 'visit_salt_%' AND key < ?", [key]),
  ]);
  const value = (row.rows[0] as { value: string }).value;
  saltCache = { day, value };
  return value;
}

export async function recordView(path: string, ip: string, userAgent: string): Promise<boolean> {
  if (!userAgent || BOT_RE.test(userAgent)) return false;
  const day = shopDay();
  const visitor = createHash("sha256").update(`${await salt(day)}|${ip}|${userAgent}`).digest("hex").slice(0, 20);
  await db().batch([
    new Statement("INSERT OR IGNORE INTO visit_days (day, visitor) VALUES (?, ?)", [day, visitor]),
    new Statement(
      "INSERT INTO page_views (day, path, views) VALUES (?, ?, 1) ON CONFLICT(day, path) DO UPDATE SET views = views + 1",
      [day, path],
    ),
  ]);
  return true;
}
