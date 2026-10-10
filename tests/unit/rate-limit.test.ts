import { afterEach, describe, expect, it, vi } from "vitest";
import { clientIp, memoryRateLimiter, rateLimiter } from "@/lib/rate-limit";
import { setRequestHeaders } from "../setup/next-headers";

afterEach(() => vi.useRealTimers());

describe("rateLimiter (stored in the database)", () => {
  it("allows `max` attempts per key, then refuses", async () => {
    const limit = rateLimiter("t1", 3, 60_000);
    const hits = [];
    for (let i = 0; i < 4; i++) hits.push(await limit.hit("a"));
    expect(hits).toEqual([true, true, true, false]);
    expect(await limit.hit("b")).toBe(true);
  });

  it("keeps separate counts per limiter name", async () => {
    const a = rateLimiter("t2", 1, 60_000);
    const b = rateLimiter("t3", 1, 60_000);
    expect(await a.hit("x")).toBe(true);
    expect(await b.hit("x")).toBe(true);
    expect(await a.hit("x")).toBe(false);
  });

  it("starts over in the next window", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const limit = rateLimiter("t4", 1, 60_000);
    expect(await limit.hit("a")).toBe(true);
    expect(await limit.hit("a")).toBe(false);
    vi.setSystemTime(Date.now() + 60_001);
    expect(await limit.hit("a")).toBe(true);
  });

  it("exhausted() reads without counting, reset() starts over", async () => {
    const limit = rateLimiter("t5", 2, 60_000);
    expect(await limit.exhausted("a")).toBe(false);
    await limit.hit("a");
    await limit.hit("a");
    expect(await limit.exhausted("a")).toBe(true);
    await limit.reset("a");
    expect(await limit.exhausted("a")).toBe(false);
  });

  it("stores no IP address in clear", async () => {
    const { db } = await import("@/lib/db");
    await rateLimiter("t6", 5, 60_000).hit("203.0.113.7");
    const keys = (await db().prepare("SELECT key FROM rate_hits").all()) as { key: string }[];
    expect(keys.some((k) => k.key.includes("203.0.113.7"))).toBe(false);
  });
});

describe("memoryRateLimiter", () => {
  it("allows `max` attempts per key, then refuses", () => {
    const hit = memoryRateLimiter(3, 60_000);
    expect([hit("a"), hit("a"), hit("a"), hit("a")]).toEqual([true, true, true, false]);
    expect(hit("b")).toBe(true);
  });

  it("starts over once the window has passed", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const hit = memoryRateLimiter(1, 60_000);
    expect(hit("a")).toBe(true);
    expect(hit("a")).toBe(false);
    vi.setSystemTime(Date.now() + 60_001);
    expect(hit("a")).toBe(true);
  });
});

describe("clientIp", () => {
  it("prefers CF-Connecting-IP (set by Cloudflare)", async () => {
    setRequestHeaders({ "cf-connecting-ip": "198.51.100.9", "x-forwarded-for": "203.0.113.7" });
    expect(await clientIp()).toBe("198.51.100.9");
  });

  it("takes the first address of X-Forwarded-For", async () => {
    setRequestHeaders({ "x-forwarded-for": " 203.0.113.7 , 10.0.0.1" });
    expect(await clientIp()).toBe("203.0.113.7");
  });

  it("falls back to X-Real-IP, then to 'unknown'", async () => {
    setRequestHeaders({ "x-real-ip": "198.51.100.2" });
    expect(await clientIp()).toBe("198.51.100.2");
    setRequestHeaders({});
    expect(await clientIp()).toBe("unknown");
  });
});
