import path from "node:path";
import { describe, expect, it } from "vitest";
import { DATA_DIR, db } from "@/lib/db";

describe("test database", () => {
  it("lives in a temp folder, never in the shop's data/ folder", () => {
    expect(path.resolve(DATA_DIR)).not.toBe(path.resolve("data"));
    expect(DATA_DIR).toContain("nahel-test-");
  });

  it("opens with the starter catalog", () => {
    const { n } = db().prepare("SELECT COUNT(*) AS n FROM products").get() as { n: number };
    expect(n).toBeGreaterThan(0);
  });

  it("is fresh for every test (write)", () => {
    db().prepare("INSERT INTO meta (key, value) VALUES ('smoke', 'x')").run();
    expect(db().prepare("SELECT value FROM meta WHERE key = 'smoke'").get()).toEqual({ value: "x" });
  });

  it("is fresh for every test (the previous write is gone)", () => {
    expect(db().prepare("SELECT value FROM meta WHERE key = 'smoke'").get()).toBeUndefined();
  });
});
