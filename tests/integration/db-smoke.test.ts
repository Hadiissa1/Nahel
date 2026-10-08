import path from "node:path";
import { describe, expect, it } from "vitest";
import { DATA_DIR, db } from "@/lib/db";

describe("test database", () => {
  it("lives in a temp folder, never in the shop's data/ folder", () => {
    expect(path.resolve(DATA_DIR)).not.toBe(path.resolve("data"));
    expect(DATA_DIR).toContain("nahel-test-");
  });

  it("is shared safely between processes (WAL, waits up to 5 s for a lock)", () => {
    expect(db().prepare("PRAGMA journal_mode").get()).toEqual({ journal_mode: "wal" });
    expect(db().prepare("PRAGMA busy_timeout").get()).toEqual({ timeout: 5000 });
    expect(db().prepare("PRAGMA foreign_keys").get()).toEqual({ foreign_keys: 1 });
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
