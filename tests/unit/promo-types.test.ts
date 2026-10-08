import { describe, expect, it } from "vitest";
import { computeDiscount, MAX_PERCENT, normalizeCode, type PromoRule } from "@/lib/promo-types";

const percent = (value: number): PromoRule => ({ code: "P", kind: "percent", value, minTotal: null });
const amount = (value: number): PromoRule => ({ code: "A", kind: "amount", value, minTotal: null });

describe("computeDiscount", () => {
  it("takes a percentage of the subtotal", () => {
    expect(computeDiscount(percent(10), 5000)).toBe(500);
  });

  it("rounds a percentage to the nearest cent", () => {
    expect(computeDiscount(percent(15), 999)).toBe(150); // 149.85
  });

  it(`caps a percentage at ${MAX_PERCENT} %`, () => {
    expect(computeDiscount(percent(100), 1000)).toBe(900);
  });

  it("takes a fixed amount off", () => {
    expect(computeDiscount(amount(700), 5000)).toBe(700);
  });

  it("never discounts more than the subtotal", () => {
    expect(computeDiscount(amount(9000), 5000)).toBe(5000);
  });

  it("never returns a negative discount", () => {
    expect(computeDiscount(amount(-100), 5000)).toBe(0);
    expect(computeDiscount(percent(10), 0)).toBe(0);
  });
});

describe("normalizeCode", () => {
  it("trims and upper-cases what the customer typed", () => {
    expect(normalizeCode("  ramadan10 ")).toBe("RAMADAN10");
  });

  it("accepts dashes and underscores", () => {
    expect(normalizeCode("eid_2026-x")).toBe("EID_2026-X");
  });

  it.each([
    ["too short", "ab"],
    ["too long", "A".repeat(21)],
    ["a space inside", "RAMA DAN"],
    ["a symbol", "SALE%"],
    ["Arabic letters", "خصم"],
    ["empty", ""],
  ])("rejects %s", (_why, raw) => {
    expect(normalizeCode(raw)).toBeNull();
  });

  it("rejects anything that is not a string", () => {
    expect(normalizeCode(null)).toBeNull();
    expect(normalizeCode(123)).toBeNull();
    expect(normalizeCode({ code: "X" })).toBeNull();
  });
});
