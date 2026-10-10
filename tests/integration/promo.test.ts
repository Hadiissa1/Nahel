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
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-06-15T07:00:00Z"));
});
afterEach(async () => vi.useRealTimers());

describe("shopToday", () => {
  it("is the date in Beirut", async () => {
    expect(shopToday()).toBe("2026-06-15");
    vi.setSystemTime(new Date("2026-06-15T21:30:00Z")); // 00:30 on the 16th in Beirut
    expect(shopToday()).toBe("2026-06-16");
  });
});

describe("findUsablePromo", () => {
  it("returns the rule of an active code", async () => {
    await makePromo({ code: "RAMADAN10", kind: "percent", value: 10, minTotal: 3000 });
    expect(await findUsablePromo("RAMADAN10")).toEqual({
      rule: { code: "RAMADAN10", kind: "percent", value: 10, minTotal: 3000 },
    });
  });

  it("does not know a made-up code", async () => {
    expect(await findUsablePromo("NOPE")).toEqual({ error: "not_found" });
  });

  it("treats a paused code as unknown, so customers can't tell them apart", async () => {
    await makePromo({ code: "PAUSED" });
    await setPromoActive("PAUSED", false);
    expect(await findUsablePromo("PAUSED")).toEqual({ error: "not_found" });
  });

  it("is still valid on its last day and expired the day after (Beirut time)", async () => {
    await makePromo({ code: "EID", expiresOn: "2026-06-15" });
    expect(await findUsablePromo("EID")).toHaveProperty("rule");
    vi.setSystemTime(new Date("2026-06-15T21:00:00Z")); // midnight in Beirut
    expect(await findUsablePromo("EID")).toEqual({ error: "expired" });
  });

  it("is used up once it reaches its maximum uses", async () => {
    await makePromo({ code: "FIRST50", maxUses: 50 });
    await setPromoUses("FIRST50", 49);
    expect(await findUsablePromo("FIRST50")).toHaveProperty("rule");
    await setPromoUses("FIRST50", 50);
    expect(await findUsablePromo("FIRST50")).toEqual({ error: "used_up" });
  });
});

describe("admin", () => {
  it("refuses a code that already exists", async () => {
    await makePromo({ code: "DUP" });
    expect(
      await createPromoCode({ code: "DUP", kind: "amount", value: 500, minTotal: null, expiresOn: null, maxUses: null }),
    ).toBe("taken");
  });

  it("lists codes with their status", async () => {
    await makePromo({ code: "LIVE" });
    await makePromo({ code: "OLD", expiresOn: "2026-01-01" });
    await makePromo({ code: "GONE", maxUses: 1 });
    await setPromoUses("GONE", 1);
    await makePromo({ code: "OFF" });
    await setPromoActive("OFF", false);

    const status = Object.fromEntries((await listPromoCodes()).map((c) => [c.code, c.status]));
    expect(status).toEqual({ LIVE: "active", OLD: "expired", GONE: "used_up", OFF: "paused" });
  });

  it("pauses, resumes and deletes a code", async () => {
    await makePromo({ code: "X1" });
    expect(await setPromoActive("X1", false)).toBe(true);
    expect(await setPromoActive("X1", true)).toBe(true);
    expect(await findUsablePromo("X1")).toHaveProperty("rule");
    expect(await deletePromoCode("X1")).toBe(true);
    expect(await deletePromoCode("X1")).toBe(false);
    expect(await setPromoActive("X1", true)).toBe(false);
  });
});
