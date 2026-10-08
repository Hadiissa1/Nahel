import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createPromoCode,
  deletePromoCode,
  findUsablePromo,
  listPromoCodes,
  setPromoActive,
  shopToday,
} from "@/lib/promo";
import { makePromo, setPromoUses } from "../setup/fixtures";

// 10:00 in Beirut on 15 June 2026.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-06-15T07:00:00Z"));
});
afterEach(() => vi.useRealTimers());

describe("shopToday", () => {
  it("is the date in Beirut", () => {
    expect(shopToday()).toBe("2026-06-15");
    vi.setSystemTime(new Date("2026-06-15T21:30:00Z")); // 00:30 on the 16th in Beirut
    expect(shopToday()).toBe("2026-06-16");
  });
});

describe("findUsablePromo", () => {
  it("returns the rule of an active code", () => {
    makePromo({ code: "RAMADAN10", kind: "percent", value: 10, minTotal: 3000 });
    expect(findUsablePromo("RAMADAN10")).toEqual({
      rule: { code: "RAMADAN10", kind: "percent", value: 10, minTotal: 3000 },
    });
  });

  it("does not know a made-up code", () => {
    expect(findUsablePromo("NOPE")).toEqual({ error: "not_found" });
  });

  it("treats a paused code as unknown, so customers can't tell them apart", () => {
    makePromo({ code: "PAUSED" });
    setPromoActive("PAUSED", false);
    expect(findUsablePromo("PAUSED")).toEqual({ error: "not_found" });
  });

  it("is still valid on its last day and expired the day after (Beirut time)", () => {
    makePromo({ code: "EID", expiresOn: "2026-06-15" });
    expect(findUsablePromo("EID")).toHaveProperty("rule");
    vi.setSystemTime(new Date("2026-06-15T21:00:00Z")); // midnight in Beirut
    expect(findUsablePromo("EID")).toEqual({ error: "expired" });
  });

  it("is used up once it reaches its maximum uses", () => {
    makePromo({ code: "FIRST50", maxUses: 50 });
    setPromoUses("FIRST50", 49);
    expect(findUsablePromo("FIRST50")).toHaveProperty("rule");
    setPromoUses("FIRST50", 50);
    expect(findUsablePromo("FIRST50")).toEqual({ error: "used_up" });
  });
});

describe("admin", () => {
  it("refuses a code that already exists", () => {
    makePromo({ code: "DUP" });
    expect(
      createPromoCode({ code: "DUP", kind: "amount", value: 500, minTotal: null, expiresOn: null, maxUses: null }),
    ).toBe("taken");
  });

  it("lists codes with their status", () => {
    makePromo({ code: "LIVE" });
    makePromo({ code: "OLD", expiresOn: "2026-01-01" });
    makePromo({ code: "GONE", maxUses: 1 });
    setPromoUses("GONE", 1);
    makePromo({ code: "OFF" });
    setPromoActive("OFF", false);

    const status = Object.fromEntries(listPromoCodes().map((c) => [c.code, c.status]));
    expect(status).toEqual({ LIVE: "active", OLD: "expired", GONE: "used_up", OFF: "paused" });
  });

  it("pauses, resumes and deletes a code", () => {
    makePromo({ code: "X1" });
    expect(setPromoActive("X1", false)).toBe(true);
    expect(setPromoActive("X1", true)).toBe(true);
    expect(findUsablePromo("X1")).toHaveProperty("rule");
    expect(deletePromoCode("X1")).toBe(true);
    expect(deletePromoCode("X1")).toBe(false);
    expect(setPromoActive("X1", true)).toBe(false);
  });
});
