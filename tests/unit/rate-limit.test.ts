import { afterEach, describe, expect, it, vi } from "vitest";
import { clientIp, rateLimiter } from "@/lib/rate-limit";
import { setRequestHeaders } from "../setup/next-headers";

afterEach(() => vi.useRealTimers());

describe("rateLimiter", () => {
  it("allows `max` attempts per key, then refuses", () => {
    const hit = rateLimiter(3, 60_000);
    expect([hit("a"), hit("a"), hit("a"), hit("a")]).toEqual([true, true, true, false]);
    expect(hit("b")).toBe(true);
  });

  it("starts over once the window has passed", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const hit = rateLimiter(1, 60_000);
    expect(hit("a")).toBe(true);
    expect(hit("a")).toBe(false);
    vi.setSystemTime(Date.now() + 60_001);
    expect(hit("a")).toBe(true);
  });
});

describe("clientIp", () => {
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
