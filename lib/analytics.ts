import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { shopDay } from "@/lib/shop-time";

/**
 * Privacy-friendly visit counting: no cookie, no IP address stored.
 * A visitor is a hash of (secret of the day + IP + browser); the secret is
 * random, changes every day and older ones are deleted, so nobody can be
 * recognised from one day to the next. Counts are buffered in memory and
 * written every few seconds, so heavy traffic doesn't hammer the database.
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

type Buffer = { visitors: Set<string>; views: Map<string, number>; timer?: NodeJS.Timeout };
const g = globalThis as unknown as { __nahelVisits?: Buffer };
const buf: Buffer = (g.__nahelVisits ??= { visitors: new Set<string>(), views: new Map<string, number>() });

function salt(day: string): string {
  const d = db();
  const key = `visit_salt_${day}`;
  const row = d.prepare("SELECT value FROM meta WHERE key = ?").get(key) as { value: string } | undefined;
  if (row) return row.value;
  d.prepare("INSERT OR IGNORE INTO meta (key, value) VALUES (?, ?)").run(key, randomBytes(16).toString("hex"));
  // Forget older secrets: yesterday's visitors can't be linked to today's.
  d.prepare("DELETE FROM meta WHERE key LIKE 'visit_salt_%' AND key < ?").run(key);
  return (d.prepare("SELECT value FROM meta WHERE key = ?").get(key) as { value: string }).value;
}

export function recordView(path: string, ip: string, userAgent: string): boolean {
  if (!userAgent || BOT_RE.test(userAgent)) return false;
  const day = shopDay();
  const visitor = createHash("sha256").update(`${salt(day)}|${ip}|${userAgent}`).digest("hex").slice(0, 20);
  buf.visitors.add(`${day}|${visitor}`);
  const k = `${day}|${path}`;
  buf.views.set(k, (buf.views.get(k) ?? 0) + 1);
  if (buf.visitors.size + buf.views.size > 2000) flushVisits();
  else buf.timer ??= setTimeout(flushVisits, 10_000).unref();
  return true;
}

/** Write buffered counts (also called before showing reports). */
export function flushVisits() {
  if (buf.timer) clearTimeout(buf.timer);
  buf.timer = undefined;
  if (buf.visitors.size === 0 && buf.views.size === 0) return;
  const visitors = [...buf.visitors];
  const views = [...buf.views];
  buf.visitors.clear();
  buf.views.clear();
  const d = db();
  d.exec("BEGIN IMMEDIATE");
  try {
    const v = d.prepare("INSERT OR IGNORE INTO visit_days (day, visitor) VALUES (?, ?)");
    for (const k of visitors) {
      const [day, visitor] = k.split("|");
      v.run(day, visitor);
    }
    const p = d.prepare(
      "INSERT INTO page_views (day, path, views) VALUES (?, ?, ?) ON CONFLICT(day, path) DO UPDATE SET views = views + excluded.views",
    );
    for (const [k, n] of views) {
      const i = k.indexOf("|");
      p.run(k.slice(0, i), k.slice(i + 1), n);
    }
    d.exec("COMMIT");
  } catch (e) {
    d.exec("ROLLBACK");
    console.error("visit counts not saved", e);
  }
}
