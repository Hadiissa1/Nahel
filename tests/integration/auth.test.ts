import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getSession,
  hashPassword,
  isAdmin,
  isAdminConfigured,
  login,
  logout,
  requireAdmin,
  requireStaff,
} from "@/lib/auth";
import { createStaff, deleteStaff, listStaff, setStaffActive, setStaffPassword } from "@/lib/staff";
import { cookieJar, cookieOptions, resetRequest, setRequestHeaders } from "../setup/next-headers";
import { RedirectError } from "../setup/next-navigation";

const OWNER_PASSWORD = "correct-horse-battery";
const COOKIE = "nahel_admin";

// The failed-login counter lives in memory for the whole file: each test
// signs in from its own made-up IP address so tests don't block each other.
let nextIp = 0;
beforeEach(async () => {
  resetRequest();
  nextIp++;
  setRequestHeaders({ "x-forwarded-for": `10.0.0.${nextIp}` });
  process.env.ADMIN_PASSWORD = OWNER_PASSWORD;
});
afterEach(async () => {
  delete process.env.ADMIN_PASSWORD;
  vi.useRealTimers();
});

const redirectOf = async (p: Promise<unknown>) => {
  const e = await p.then(() => null, (err: unknown) => err);
  return e instanceof RedirectError ? e.url : null;
};

async function staff(username = `amal${randomUUID().slice(0, 4)}`, password = "staff-password-1") {
  expect(await createStaff({ username, name: "Amal", password })).toBe("ok");
  return { username, password, id: (await listStaff()).find((s) => s.username === username)!.id };
}

describe("owner password", () => {
  it("disables the admin when ADMIN_PASSWORD is missing or shorter than 12 characters", async () => {
    delete process.env.ADMIN_PASSWORD;
    expect(isAdminConfigured()).toBe(false);
    expect(await login("", "")).toBe("not_configured");

    process.env.ADMIN_PASSWORD = "short-pw-11";
    expect(isAdminConfigured()).toBe(false);
    expect(await login("", "short-pw-11")).toBe("not_configured");

    process.env.ADMIN_PASSWORD = "long-enough-12";
    expect(isAdminConfigured()).toBe(true);
  });

  it("signs the owner in with a secure, http-only cookie", async () => {
    setRequestHeaders({ host: "nahel.test", "x-forwarded-for": "10.9.9.9" });
    expect(await login("", OWNER_PASSWORD)).toBe("ok");
    expect(cookieJar.get(COOKIE)).toMatch(/^[\w-]{40,}$/);
    expect(cookieOptions.get(COOKIE)).toMatchObject({ httpOnly: true, secure: true, sameSite: "strict", path: "/" });
    expect(await getSession()).toEqual({ role: "owner", userId: null, name: "Owner" });
    expect(await isAdmin()).toBe(true);
  });

  it("allows a non-secure cookie on localhost only (local testing)", async () => {
    setRequestHeaders({ host: "localhost:3000", "x-forwarded-for": "10.9.9.8" });
    await login("", OWNER_PASSWORD);
    expect(cookieOptions.get(COOKIE)).toMatchObject({ secure: false });
  });

  it("refuses a wrong password", async () => {
    expect(await login("", "wrong-password")).toBe("invalid");
    expect(cookieJar.has(COOKIE)).toBe(false);
    expect(await getSession()).toBeNull();
  });

  it("blocks an address after 5 failures, even with the right password", async () => {
    for (let i = 0; i < 4; i++) expect(await login("", "wrong")).toBe("invalid");
    expect(await login("", "wrong")).toBe("blocked");
    expect(await login("", OWNER_PASSWORD)).toBe("blocked");

    setRequestHeaders({ "x-forwarded-for": "10.200.200.200" });
    expect(await login("", OWNER_PASSWORD)).toBe("ok");
  });

  it("unblocks the address after 15 minutes", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    for (let i = 0; i < 5; i++) await login("", "wrong");
    expect(await login("", OWNER_PASSWORD)).toBe("blocked");
    vi.setSystemTime(Date.now() + 15 * 60 * 1000 + 1);
    expect(await login("", OWNER_PASSWORD)).toBe("ok");
  });
});

describe("sessions", () => {
  it("ends on logout", async () => {
    await login("", OWNER_PASSWORD);
    const token = cookieJar.get(COOKIE)!;
    await logout();
    expect(cookieJar.has(COOKIE)).toBe(false);
    cookieJar.set(COOKIE, token); // an old copy of the cookie no longer works
    expect(await getSession()).toBeNull();
  });

  it("expires after 12 hours", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    await login("", OWNER_PASSWORD);
    vi.setSystemTime(Date.now() + 12 * 3600 * 1000 - 1000);
    expect(await getSession()).not.toBeNull();
    vi.setSystemTime(Date.now() + 2000);
    expect(await getSession()).toBeNull();
  });

  it("ignores a made-up or oversized cookie", async () => {
    cookieJar.set(COOKIE, "made-up-token");
    expect(await getSession()).toBeNull();
    cookieJar.set(COOKIE, "x".repeat(101));
    expect(await getSession()).toBeNull();
  });

  it("stops working when the admin password is removed from the server", async () => {
    await login("", OWNER_PASSWORD);
    delete process.env.ADMIN_PASSWORD;
    expect(await getSession()).toBeNull();
  });
});

describe("staff accounts", () => {
  it("signs staff in by username (case-insensitive)", async () => {
    const s = await staff("karim");
    expect(await login("  Karim ", s.password)).toBe("ok");
    expect(await getSession()).toEqual({ role: "staff", userId: s.id, name: "Amal" });
    expect(await isAdmin()).toBe(false);
    expect((await listStaff())[0].lastLogin).not.toBeNull();
  });

  it("refuses a wrong password or an unknown username the same way", async () => {
    const s = await staff();
    expect(await login(s.username, "wrong-password")).toBe("invalid");
    expect(await login("nobody", s.password)).toBe("invalid");
  });

  it("does not let staff sign in with the owner password", async () => {
    const s = await staff();
    expect(await login(s.username, OWNER_PASSWORD)).toBe("invalid");
  });

  it("refuses a username that is taken", async () => {
    await staff("samir");
    expect(await createStaff({ username: "samir", name: "Other", password: "another-pass" })).toBe("taken");
  });

  it("salts every password (same password, different hashes, never stored in clear)", async () => {
    const a = hashPassword("same-password");
    const b = hashPassword("same-password");
    expect(a).not.toBe(b);
    expect(a).not.toContain("same-password");
    expect(a).toMatch(/^[0-9a-f]{32}:[0-9a-f]{64}$/);
  });

  it("signs out and blocks a deactivated account at once", async () => {
    const s = await staff();
    await login(s.username, s.password);
    expect(await setStaffActive(s.id, false)).toBe(true);
    expect(await getSession()).toBeNull();
    expect(await login(s.username, s.password)).toBe("invalid");

    await setStaffActive(s.id, true);
    expect(await login(s.username, s.password)).toBe("ok");
  });

  it("signs the person out when their password is changed", async () => {
    const s = await staff();
    await login(s.username, s.password);
    expect(await setStaffPassword(s.id, "brand-new-password")).toBe(true);
    expect(await getSession()).toBeNull();
    expect(await login(s.username, s.password)).toBe("invalid");
    expect(await login(s.username, "brand-new-password")).toBe("ok");
  });

  it("signs the person out when the account is deleted", async () => {
    const s = await staff();
    await login(s.username, s.password);
    expect(await deleteStaff(s.id)).toBe(true);
    expect(await getSession()).toBeNull();
    expect(await deleteStaff(s.id)).toBe(false);
  });

  it("returns false for an unknown account", async () => {
    expect(await setStaffActive("nope", false)).toBe(false);
    expect(await setStaffPassword("nope", "whatever-pass")).toBe(false);
  });
});

describe("access rules", () => {
  it("sends visitors without a session to the login page", async () => {
    expect(await redirectOf(requireAdmin())).toBe("/admin/login");
    expect(await redirectOf(requireStaff())).toBe("/admin/login");
  });

  it("lets the owner in everywhere", async () => {
    await login("", OWNER_PASSWORD);
    expect(await requireAdmin()).toMatchObject({ role: "owner" });
    expect(await requireStaff()).toMatchObject({ role: "owner" });
  });

  it("keeps staff out of owner-only pages (sent to orders)", async () => {
    const s = await staff();
    await login(s.username, s.password);
    expect(await redirectOf(requireAdmin())).toBe("/admin/orders");
    expect(await requireStaff()).toMatchObject({ role: "staff", userId: s.id });
  });
});
