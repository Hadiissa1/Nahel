import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/lib/db";

const COOKIE = "nahel_admin";
const SESSION_HOURS = 12;
export const MIN_PASSWORD_LENGTH = 12;

const sha256 = (s: string) => createHash("sha256").update(s).digest();

/** Null when no usable admin password is configured on the server. */
function configuredPassword(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  return pw && pw.length >= MIN_PASSWORD_LENGTH ? pw : null;
}

export function isAdminConfigured() {
  return configuredPassword() !== null;
}

function passwordMatches(candidate: string) {
  const pw = configuredPassword();
  if (!pw) return false;
  // Compare fixed-length digests in constant time.
  return timingSafeEqual(sha256(candidate), sha256(pw));
}

// ---- Login rate limiting (per client IP, per server process) ----
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const failures = new Map<string, { count: number; first: number }>();

async function clientIp() {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

// Site-wide backstop: the per-IP limit relies on X-Forwarded-For, which a
// client can forge, so all failures together are capped too.
const GLOBAL_MAX_FAILURES = 100;
let globalFailures = { count: 0, first: 0 };

function isBlocked(ip: string) {
  if (Date.now() - globalFailures.first > WINDOW_MS) globalFailures = { count: 0, first: Date.now() };
  if (globalFailures.count >= GLOBAL_MAX_FAILURES) return true;
  const f = failures.get(ip);
  if (!f) return false;
  if (Date.now() - f.first > WINDOW_MS) {
    failures.delete(ip);
    return false;
  }
  return f.count >= MAX_FAILURES;
}

function recordFailure(ip: string) {
  globalFailures.count++;
  const f = failures.get(ip);
  if (!f || Date.now() - f.first > WINDOW_MS) failures.set(ip, { count: 1, first: Date.now() });
  else f.count++;
  if (failures.size > 10_000) failures.clear(); // bound memory
}

async function isLocalhost() {
  const host = (await headers()).get("host")?.replace(/:\d+$/, "");
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

export type LoginResult = "ok" | "invalid" | "blocked" | "not_configured";

export async function login(password: string): Promise<LoginResult> {
  if (!isAdminConfigured()) return "not_configured";
  const ip = await clientIp();
  if (isBlocked(ip)) return "blocked";
  if (!passwordMatches(password)) {
    recordFailure(ip);
    await new Promise((r) => setTimeout(r, 400)); // slow down guessing
    return isBlocked(ip) ? "blocked" : "invalid";
  }
  failures.delete(ip);

  const token = randomBytes(32).toString("base64url");
  const expires = Date.now() + SESSION_HOURS * 3600 * 1000;
  const d = db();
  d.prepare("DELETE FROM sessions WHERE expires_at < ?").run(Date.now());
  d.prepare("INSERT INTO sessions (token_hash, expires_at) VALUES (?, ?)").run(
    sha256(token).toString("hex"),
    expires,
  );
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
    db().prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha256(token).toString("hex"));
  }
  jar.delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  // Wait for the request FIRST: admin pages must never be prerendered. If the
  // config check came first, a build without ADMIN_PASSWORD would prerender a
  // permanent redirect to the login page. connection() also keeps the
  // synchronous SQLite query and Date.now() below out of prerendering.
  await connection();
  const token = (await cookies()).get(COOKIE)?.value;
  if (!isAdminConfigured()) return false;
  if (!token || token.length > 100) return false;
  const row = db()
    .prepare("SELECT expires_at FROM sessions WHERE token_hash = ?")
    .get(sha256(token).toString("hex")) as { expires_at: number } | undefined;
  return !!row && row.expires_at > Date.now();
}

/** Call at the top of every admin page and every admin Server Action. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
