import "server-only";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Statement, db } from "@/lib/db";
import { clientIp, rateLimiter } from "@/lib/rate-limit";

/**
 * Two kinds of admin users:
 * - the owner: signs in with ADMIN_PASSWORD (no username), can do everything;
 * - staff: accounts the owner creates; orders, stock and stock alerts only.
 *
 * Secure by default: requireAdmin() (owner only) guards everything; the few
 * pages and actions open to staff use requireStaff() explicitly.
 */

const COOKIE = "nahel_admin";
const SESSION_HOURS = 12;
export const MIN_PASSWORD_LENGTH = 12;
export const MIN_STAFF_PASSWORD_LENGTH = 10;

const sha256 = (s: string) => createHash("sha256").update(s).digest();

/** Null when no usable admin password is configured on the server. */
function configuredPassword(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  return pw && pw.length >= MIN_PASSWORD_LENGTH ? pw : null;
}

export function isAdminConfigured() {
  return configuredPassword() !== null;
}

function ownerPasswordMatches(candidate: string) {
  const pw = configuredPassword();
  if (!pw) return false;
  // Compare fixed-length digests in constant time.
  return timingSafeEqual(sha256(candidate), sha256(pw));
}

// ---- Staff passwords: scrypt with a random salt per account ----

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  return `${salt.toString("hex")}:${scryptSync(password, salt, 32).toString("hex")}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), 32);
  return timingSafeEqual(actual, Buffer.from(hashHex, "hex"));
}

// Used when the username doesn't exist, so the answer takes as long either way.
// Made on first use (Cloudflare forbids random numbers at startup).
let dummyHash: string | undefined;
const dummy = () => (dummyHash ??= hashPassword(randomBytes(12).toString("hex")));

// ---- Login rate limiting (per client IP), shared by all servers ----
const WINDOW_MS = 15 * 60 * 1000;
const perIp = rateLimiter("login-ip", 5, WINDOW_MS);
// Site-wide backstop: if the IP can be faked (e.g. X-Forwarded-For without
// Cloudflare in front), all failures together are capped too.
const siteWide = rateLimiter("login-all", 100, WINDOW_MS);

async function isBlocked(ip: string) {
  return (await siteWide.exhausted("all")) || (await perIp.exhausted(ip));
}

async function recordFailure(ip: string) {
  await siteWide.hit("all");
  await perIp.hit(ip);
}

async function isLocalhost() {
  const host = (await headers()).get("host")?.replace(/:\d+$/, "");
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

export type LoginResult = "ok" | "invalid" | "blocked" | "not_configured";

/** Empty username = the owner (ADMIN_PASSWORD); otherwise a staff account. */
export async function login(username: string, password: string): Promise<LoginResult> {
  if (!isAdminConfigured()) return "not_configured";
  const ip = await clientIp();
  if (await isBlocked(ip)) return "blocked";

  let userId: string | null = null;
  let ok: boolean;
  if (!username) {
    ok = ownerPasswordMatches(password);
  } else {
    const user = (await db()
      .prepare("SELECT id, pw_hash FROM staff WHERE username = ? AND active = 1")
      .get(username.trim().toLowerCase())) as { id: string; pw_hash: string } | undefined;
    ok = verifyPassword(password, user?.pw_hash ?? dummy()) && Boolean(user);
    userId = user?.id ?? null;
  }
  if (!ok) {
    await recordFailure(ip);
    await new Promise((r) => setTimeout(r, 400)); // slow down guessing
    return (await isBlocked(ip)) ? "blocked" : "invalid";
  }
  await perIp.reset(ip);

  const token = randomBytes(32).toString("base64url");
  const expires = Date.now() + SESSION_HOURS * 3600 * 1000;
  await db().batch([
    new Statement("DELETE FROM sessions WHERE expires_at < ?", [Date.now()]),
    new Statement("INSERT INTO sessions (token_hash, expires_at, user_id) VALUES (?, ?, ?)", [
      sha256(token).toString("hex"),
      expires,
      userId,
    ]),
    ...(userId ? [new Statement("UPDATE staff SET last_login = datetime('now') WHERE id = ?", [userId])] : []),
  ]);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    // HTTPS-only everywhere, except on this machine's own localhost (plain
    // HTTP there never leaves the computer), so the admin can be tested locally.
    secure: !(await isLocalhost()),
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
  return "ok";
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await db().prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha256(token).toString("hex"));
  }
  jar.delete(COOKIE);
}

/** End every session of a staff account (deactivated, deleted, new password). */
export async function endSessionsOf(userId: string) {
  await db().prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}

export interface Session {
  role: "owner" | "staff";
  /** Staff account id; null for the owner. */
  userId: string | null;
  /** Shown in the admin and recorded on orders. */
  name: string;
}

export async function getSession(): Promise<Session | null> {
  // Wait for the request FIRST: admin pages must never be prerendered. If the
  // config check came first, a build without ADMIN_PASSWORD would prerender a
  // permanent redirect to the login page. connection() also keeps the
  // database query and Date.now() below out of prerendering.
  await connection();
  const token = (await cookies()).get(COOKIE)?.value;
  if (!isAdminConfigured()) return null;
  if (!token || token.length > 100) return null;
  const row = (await db()
    .prepare(
      `SELECT s.expires_at, s.user_id, u.name, u.active
       FROM sessions s LEFT JOIN staff u ON u.id = s.user_id
       WHERE s.token_hash = ?`,
    )
    .get(sha256(token).toString("hex"))) as
    | { expires_at: number; user_id: string | null; name: string | null; active: number | null }
    | undefined;
  if (!row || row.expires_at <= Date.now()) return null;
  if (row.user_id === null) return { role: "owner", userId: null, name: "Owner" };
  // A deleted or deactivated account is signed out at once.
  if (row.active !== 1 || !row.name) return null;
  return { role: "staff", userId: row.user_id, name: row.name };
}

/** True for the owner only. */
export async function isAdmin(): Promise<boolean> {
  return (await getSession())?.role === "owner";
}

/** Owner only. Call at the top of every admin page and Server Action (the default). */
export async function requireAdmin(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  // Staff reaching an owner page land on their own start page.
  if (s.role !== "owner") redirect("/admin/orders");
  return s;
}

/** Owner or staff: only for the pages and actions staff may use. */
export async function requireStaff(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  return s;
}
