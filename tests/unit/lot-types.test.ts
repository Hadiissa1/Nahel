import { describe, expect, it } from "vitest";
import { docUrl, normalizeLotCode } from "@/lib/lot-types";

describe("normalizeLotCode", () => {
  it("upper-cases and trims what is typed or scanned", () => {
    expect(normalizeLotCode("  lb-2026-07 ")).toBe("LB-2026-07");
  });

  it("turns spaces inside into dashes", () => {
    expect(normalizeLotCode("LB 2026  07")).toBe("LB-2026-07");
  });

  it.each([
    ["too short", "AB"],
    ["too long", "A".repeat(31)],
    ["a leading dash", "-LB2026"],
    ["a trailing dash", "LB2026-"],
    ["a slash", "LB/2026"],
    ["a dot", "LB.2026"],
    ["empty", ""],
  ])("rejects %s", (_why, raw) => {
    expect(normalizeLotCode(raw)).toBeNull();
  });

  it("accepts the shortest and longest codes", () => {
    expect(normalizeLotCode("A1B")).toBe("A1B");
    expect(normalizeLotCode("A".repeat(30))).toBe("A".repeat(30));
  });

  it("rejects anything that is not a string", () => {
    expect(normalizeLotCode(undefined)).toBeNull();
    expect(normalizeLotCode(2026)).toBeNull();
  });
});

describe("docUrl", () => {
  it("points to the lab analysis file", () => {
    expect(docUrl("abc.pdf")).toBe("/docs/abc.pdf");
  });
});
