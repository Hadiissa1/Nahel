import { SHOP_TIME_ZONE } from "@/lib/config";

/** YYYY-MM-DD of an instant in the shop's time zone. */
export function shopDay(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: SHOP_TIME_ZONE }).format(at);
}

/** Minutes the shop's clock is ahead of UTC at that instant. */
function offsetMinutes(at: Date): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: SHOP_TIME_ZONE, hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).formatToParts(at).map((p) => [p.type, p.value]),
  );
  const local = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return Math.round((local - at.getTime()) / 60000);
}

/**
 * UTC instant of 00:00 (shop time) on a YYYY-MM-DD day. On the day summer
 * time starts, Beirut jumps from 23:59 to 01:00, so the day starts at 01:00.
 */
export function dayStartUtc(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d));
  // The offset at UTC midnight may already be the next one; take it again at
  // the first estimate, which falls before any change made at local midnight.
  const first = new Date(guess.getTime() - offsetMinutes(guess) * 60000);
  return new Date(guess.getTime() - offsetMinutes(first) * 60000);
}

/** SQLite "YYYY-MM-DD HH:MM:SS" (UTC) for an instant. */
export const sqliteUtc = (at: Date) => at.toISOString().slice(0, 19).replace("T", " ");

/** Shop day of a SQLite UTC timestamp. */
export const dayOfSqlite = (ts: string) => shopDay(new Date(ts.replace(" ", "T") + "Z"));

/** Adds n days to a YYYY-MM-DD day. */
export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
