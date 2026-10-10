import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { addExpense, buildReport, deleteExpense, periodDays, salesRows } from "@/lib/finance";
import { placeOrder, recordCounterSale, setOrderStatus } from "@/lib/orders";
import { clearZones, makeProduct, makePromo } from "../setup/fixtures";

// Order timestamps come from SQLite's clock, so tests move them to fixed
// dates afterwards. 2026-05-10 is in summer: Beirut = UTC+3.
const DAY = "2026-05-10";

async function webSale(qty: number, opts: { price?: number; promo?: string; deliveredAt?: string } = {}) {
  await clearZones();
  const p = await makeProduct({ variants: [{ price: opts.price ?? 2000, stock: null }] });
  const r = await placeOrder({
    lines: [{ id: p.id, variant: p.variantIds[0], qty }],
    name: "Web customer", phone: "961700", address: "", note: "", lang: "en", promo: opts.promo,
  });
  if (!r.ok) throw new Error(JSON.stringify(r));
  await setOrderStatus(r.orderId, "confirmed");
  await setOrderStatus(r.orderId, "delivered");
  await deliveredAt(r.orderId, opts.deliveredAt ?? `${DAY} 09:00:00`);
  return { orderId: r.orderId, product: p };
}

async function tillSale(qty: number, payment: "cash" | "card" | "whish", at = `${DAY} 10:00:00`) {
  const p = await makeProduct({ variants: [{ price: 1000, stock: null }] });
  const r = await recordCounterSale({ lines: [{ id: p.id, variant: p.variantIds[0], qty }], discount: null, payment, customer: "", by: null });
  if (!r.ok) throw new Error(JSON.stringify(r));
  await deliveredAt(r.orderId, at);
  return r.orderId;
}

async function deliveredAt(orderId: number, utc: string) {
  await db().prepare("UPDATE orders SET delivered_at = ?, created_at = ?, updated_at = ? WHERE id = ?").run(utc, utc, utc, orderId);
}

describe("buildReport", () => {
  it("adds up web and till sales of the period", async () => {
    await webSale(2); // 4000
    await tillSale(3, "cash"); // 3000
    await tillSale(1, "card"); // 1000
    const r = await buildReport(DAY, DAY);
    expect(r.revenue).toBe(8000);
    expect(r.sales).toBe(3);
    expect(r.units).toBe(6);
    expect(r.average).toBe(2667);
    expect(r.bySource).toEqual({ web: { sales: 1, revenue: 4000 }, counter: { sales: 2, revenue: 4000 } });
    expect(r.byPayment).toEqual({
      cash: { sales: 1, revenue: 3000 },
      card: { sales: 1, revenue: 1000 },
      whish: { sales: 0, revenue: 0 },
      on_delivery: { sales: 1, revenue: 4000 },
    });
  });

  it("profit = sales - expenses of the period", async () => {
    await webSale(5); // 10000
    await addExpense({ day: DAY, label: "Jars", category: "packaging", amount: 2500 });
    await addExpense({ day: "2026-05-11", label: "Next day", category: "other", amount: 999 });
    const r = await buildReport(DAY, DAY);
    expect(r.expenses.total).toBe(2500);
    expect(r.expenses.list).toEqual([expect.objectContaining({ label: "Jars", category: "packaging", amount: 2500 })]);
    expect(r.profit).toBe(7500);
  });

  it("counts only delivered orders, on the day they were delivered", async () => {
    await clearZones();
    const p = await makeProduct({ variants: [{ price: 2000, stock: null }] });
    const place = async () => {
      const r = await placeOrder({ lines: [{ id: p.id, variant: p.variantIds[0], qty: 1 }], name: "x", phone: "1", address: "", note: "", lang: "en" });
      if (!r.ok) throw new Error();
      return r.orderId;
    };
    await place(); // new
    await setOrderStatus(await place(), "confirmed"); // pending
    const cancelled = await place();
    await setOrderStatus(cancelled, "cancelled");
    await webSale(1, { deliveredAt: "2026-05-11 09:00:00" }); // another day

    const r = await buildReport(DAY, DAY);
    expect(r.sales).toBe(0);
    expect(r.revenue).toBe(0);
    expect(r.pending).toEqual({ orders: 1, revenue: 2000 });
  });

  it("uses Beirut days, not UTC days", async () => {
    // 21:30 UTC on the 9th = 00:30 on the 10th in Beirut.
    await webSale(1, { deliveredAt: "2026-05-09 21:30:00" });
    // 20:59 UTC on the 10th = 23:59 on the 10th in Beirut.
    await webSale(1, { deliveredAt: "2026-05-10 20:59:00" });
    // 21:00 UTC on the 10th = 00:00 on the 11th in Beirut.
    await webSale(1, { deliveredAt: "2026-05-10 21:00:00" });
    expect((await buildReport(DAY, DAY)).sales).toBe(2);
    expect((await buildReport("2026-05-11", "2026-05-11")).sales).toBe(1);
  });

  it("puts sales on the right day when summer time starts (B1)", async () => {
    // 21:30 UTC on 28 March 2026 = 23:30 on the 28th (still winter time).
    await webSale(1, { deliveredAt: "2026-03-28 21:30:00" });
    // 22:30 UTC = 01:30 on the 29th (clocks jumped from 00:00 to 01:00).
    await webSale(1, { deliveredAt: "2026-03-28 22:30:00" });
    expect((await buildReport("2026-03-28", "2026-03-28")).sales).toBe(1);
    expect((await buildReport("2026-03-29", "2026-03-29")).sales).toBe(1);
    expect(await salesRows("2026-03-29", "2026-03-29")).toHaveLength(1);
  });

  it("keeps discounts and delivery fees, and leaves price-on-request sales out of the average", async () => {
    await makePromo({ code: "TEN", kind: "amount", value: 1000 });
    await webSale(2, { promo: "TEN" }); // 4000 - 1000 = 3000
    await clearZones();
    const p = await makeProduct({ variants: [{ price: null, stock: null }] });
    const r0 = await placeOrder({ lines: [{ id: p.id, variant: p.variantIds[0], qty: 1 }], name: "x", phone: "1", address: "", note: "", lang: "en" });
    if (!r0.ok) throw new Error();
    await setOrderStatus(r0.orderId, "confirmed");
    await setOrderStatus(r0.orderId, "delivered");
    await deliveredAt(r0.orderId, `${DAY} 12:00:00`);

    const r = await buildReport(DAY, DAY);
    expect(r.discounts).toBe(1000);
    expect(r.revenue).toBe(3000);
    expect(r.unpriced).toBe(1);
    expect(r.average).toBe(3000);
  });

  it("ranks best sellers by revenue", async () => {
    const small = (await webSale(1, { price: 500 })).product;
    const big = (await webSale(2, { price: 3000 })).product;
    const r = await buildReport(DAY, DAY);
    expect(r.top.map((t) => [t.name.en, t.units, t.revenue])).toEqual([
      [big.name, 2, 6000],
      [small.name, 1, 500],
    ]);
  });

  it("has one row per day, with that day's sales", async () => {
    await webSale(1, { deliveredAt: "2026-05-11 09:00:00" });
    const r = await buildReport(DAY, "2026-05-12");
    expect(r.daily.map((d) => [d.day, d.sales, d.revenue])).toEqual([
      ["2026-05-10", 0, 0],
      ["2026-05-11", 1, 2000],
      ["2026-05-12", 0, 0],
    ]);
  });
});

describe("salesRows (CSV export)", () => {
  it("lists delivered sales of the period, oldest first", async () => {
    const later = await tillSale(1, "card", `${DAY} 15:00:00`);
    const earlier = (await webSale(1)).orderId;
    await tillSale(1, "cash", "2026-05-12 10:00:00");
    const rows = await salesRows(DAY, DAY);
    expect(rows.map((r) => [r.id, r.source, r.payment, r.total])).toEqual([
      [earlier, "web", null, 2000],
      [later, "counter", "card", 1000],
    ]);
  });
});

describe("expenses", () => {
  it("can be deleted", async () => {
    await addExpense({ day: DAY, label: "Fuel", category: "transport", amount: 800 });
    const [e] = (await buildReport(DAY, DAY)).expenses.list;
    expect(await deleteExpense(e.id)).toBe(true);
    expect(await deleteExpense(e.id)).toBe(false);
    expect((await buildReport(DAY, DAY)).expenses.total).toBe(0);
  });
});

describe("periodDays", () => {
  afterEach(async () => vi.useRealTimers());

  // Wednesday 2026-05-13, 10:00 in Beirut.
  const at = (iso = "2026-05-13T07:00:00Z") => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(iso));
  };

  it.each([
    ["today", "2026-05-13", "2026-05-13"],
    ["yesterday", "2026-05-12", "2026-05-12"],
    ["week", "2026-05-11", "2026-05-13"], // weeks start on Monday
    ["month", "2026-05-01", "2026-05-13"],
    ["last-month", "2026-04-01", "2026-04-30"],
    ["year", "2026-01-01", "2026-05-13"],
  ] as const)("%s", (key, from, to) => {
    at();
    expect(periodDays(key)).toEqual({ from, to });
  });

  it("starts a week on Monday even on Sunday", async () => {
    at("2026-05-17T07:00:00Z"); // Sunday
    expect(periodDays("week")).toEqual({ from: "2026-05-11", to: "2026-05-17" });
  });

  it("handles last month in January", async () => {
    at("2026-01-20T07:00:00Z");
    expect(periodDays("last-month")).toEqual({ from: "2025-12-01", to: "2025-12-31" });
  });

  it("swaps custom dates given backwards and rejects bad dates", async () => {
    at();
    expect(periodDays("custom", "2026-05-20", "2026-05-01")).toEqual({ from: "2026-05-01", to: "2026-05-20" });
    expect(periodDays("custom", "yesterday", "2026-05-14")).toEqual({ from: "2026-05-13", to: "2026-05-14" });
  });

  it("limits a custom report to about 3 years", async () => {
    at();
    expect(periodDays("custom", "2000-01-01", "2026-05-13").from).toBe("2023-05-09");
  });
});
