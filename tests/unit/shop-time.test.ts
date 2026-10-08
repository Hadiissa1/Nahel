import { describe, expect, it } from "vitest";
import { addDays, dayOfSqlite, dayStartUtc, shopDay, sqliteUtc } from "@/lib/shop-time";

// The shop runs on Beirut time: UTC+2 in winter, UTC+3 in summer.
// In 2026 summer time starts on Sunday 29 March and ends on Sunday 25 October.

describe("shopDay", () => {
  it("uses Beirut time, not UTC", () => {
    // 22:30 UTC on 31 Dec = 00:30 on 1 Jan in Beirut (winter, UTC+2).
    expect(shopDay(new Date("2026-12-31T22:30:00Z"))).toBe("2027-01-01");
    expect(shopDay(new Date("2026-12-31T21:59:59Z"))).toBe("2026-12-31");
  });

  it("switches day at 21:00 UTC in summer", () => {
    expect(shopDay(new Date("2026-07-01T20:59:59Z"))).toBe("2026-07-01");
    expect(shopDay(new Date("2026-07-01T21:00:00Z"))).toBe("2026-07-02");
  });
});

describe("dayStartUtc", () => {
  it("is midnight Beirut time in winter (22:00 UTC the day before)", () => {
    expect(dayStartUtc("2026-01-15").toISOString()).toBe("2026-01-14T22:00:00.000Z");
  });

  it("is midnight Beirut time in summer (21:00 UTC the day before)", () => {
    expect(dayStartUtc("2026-07-01").toISOString()).toBe("2026-06-30T21:00:00.000Z");
  });

  it.each(["2026-01-15", "2026-03-28", "2026-03-30", "2026-07-01", "2026-10-24", "2026-10-25", "2026-10-26"])(
    "starts exactly on %s in shop time",
    (day) => {
      const start = dayStartUtc(day);
      expect(shopDay(start)).toBe(day);
      expect(shopDay(new Date(start.getTime() - 1))).toBe(addDays(day, -1));
    },
  );

  // BUG (see tasks/todo.md): on the day summer time starts, 00:00 does not
  // exist in Beirut (clocks jump to 01:00 = 22:00 UTC). dayStartUtc returns
  // 21:00 UTC, which is still 23:00 on the 28th, so finance reports for
  // 29 March also count the last hour of 28 March.
  it.fails("starts exactly on the day summer time begins (2026-03-29)", () => {
    expect(shopDay(dayStartUtc("2026-03-29"))).toBe("2026-03-29");
  });
});

describe("addDays", () => {
  it("adds and subtracts days across months and years", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
    expect(addDays("2026-05-10", 0)).toBe("2026-05-10");
  });
});

describe("SQLite timestamps", () => {
  it("formats an instant as SQLite UTC", () => {
    expect(sqliteUtc(new Date("2026-05-10T08:09:07.123Z"))).toBe("2026-05-10 08:09:07");
  });

  it("reads back the shop day of a SQLite UTC timestamp", () => {
    expect(dayOfSqlite("2026-05-10 20:59:59")).toBe("2026-05-10");
    expect(dayOfSqlite("2026-05-10 21:00:00")).toBe("2026-05-11");
  });
});
