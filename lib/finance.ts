import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { flushVisits } from "@/lib/analytics";
import { addDays, dayOfSqlite, dayStartUtc, shopDay, sqliteUtc } from "@/lib/shop-time";

/**
 * Sales, expenses and visits over a period, in the shop's time zone.
 * A sale counts on the day the order was delivered (web) or rung up (till).
 */

export type PeriodKey = "today" | "yesterday" | "week" | "month" | "last-month" | "year" | "custom";
export const PERIODS: PeriodKey[] = ["today", "yesterday", "week", "month", "last-month", "year", "custom"];
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Inclusive first and last day of a period. */
export function periodDays(key: PeriodKey, from?: string, to?: string): { from: string; to: string } {
  const today = shopDay();
  const [y, m] = today.split("-").map(Number);
  switch (key) {
    case "yesterday":
      return { from: addDays(today, -1), to: addDays(today, -1) };
    case "week": {
      // Weeks start on Monday.
      const dow = (new Date(today + "T12:00:00Z").getUTCDay() + 6) % 7;
      return { from: addDays(today, -dow), to: today };
    }
    case "month":
      return { from: `${today.slice(0, 7)}-01`, to: today };
    case "last-month": {
      const first = new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 10);
      return { from: first, to: addDays(`${today.slice(0, 7)}-01`, -1) };
    }
    case "year":
      return { from: `${y}-01-01`, to: today };
    case "custom": {
      let a = from && DAY_RE.test(from) ? from : today;
      let b = to && DAY_RE.test(to) ? to : today;
      if (a > b) [a, b] = [b, a];
      // At most ~3 years in one report.
      if (addDays(a, 1100) < b) a = addDays(b, -1100);
      return { from: a, to: b };
    }
    default:
      return { from: today, to: today };
  }
}

export interface DayRow {
  day: string;
  revenue: number;
  sales: number;
  visitors: number;
  views: number;
}

export interface Report {
  from: string;
  to: string;
  revenue: number;
  sales: number;
  /** Delivered orders with an unknown price (price on request): not in the revenue. */
  unpriced: number;
  units: number;
  average: number;
  discounts: number;
  deliveryFees: number;
  bySource: { web: { sales: number; revenue: number }; counter: { sales: number; revenue: number } };
  byPayment: Record<"cash" | "card" | "whish" | "on_delivery", { sales: number; revenue: number }>;
  top: { name: { ar: string; en: string }; label: string; units: number; revenue: number }[];
  /** Confirmed, not yet delivered (whole pipeline, not limited to the period). */
  pending: { orders: number; revenue: number };
  cancelled: number;
  webOrdersPlaced: number;
  expenses: { total: number; list: Expense[] };
  profit: number;
  visitors: number;
  views: number;
  topPages: { path: string; views: number }[];
  daily: DayRow[];
}

export interface Expense {
  id: string;
  day: string;
  label: string;
  category: string;
  amount: number;
}

interface SaleRow {
  id: number;
  total: number | null;
  discount: number;
  delivery_fee: number | null;
  source: "web" | "counter";
  payment: "cash" | "card" | "whish" | null;
  delivered_at: string;
}

export function buildReport(from: string, to: string): Report {
  flushVisits(); // include the last few seconds of visits
  const d = db();
  const start = sqliteUtc(dayStartUtc(from));
  const end = sqliteUtc(dayStartUtc(addDays(to, 1)));

  const days: string[] = [];
  for (let x = from; x <= to && days.length < 1200; x = addDays(x, 1)) days.push(x);
  const daily = new Map<string, DayRow>(days.map((day) => [day, { day, revenue: 0, sales: 0, visitors: 0, views: 0 }]));

  const sales = d
    .prepare(
      `SELECT id, total, discount, delivery_fee, source, payment, delivered_at FROM orders
       WHERE status = 'delivered' AND delivered_at >= ? AND delivered_at < ?`,
    )
    .all(start, end) as unknown as SaleRow[];

  const bySource = { web: { sales: 0, revenue: 0 }, counter: { sales: 0, revenue: 0 } };
  const byPayment = {
    cash: { sales: 0, revenue: 0 },
    card: { sales: 0, revenue: 0 },
    whish: { sales: 0, revenue: 0 },
    on_delivery: { sales: 0, revenue: 0 },
  };
  let revenue = 0, unpriced = 0, discounts = 0, deliveryFees = 0;
  for (const s of sales) {
    const amount = s.total ?? 0;
    if (s.total === null) unpriced++;
    revenue += amount;
    discounts += s.discount ?? 0;
    deliveryFees += s.delivery_fee ?? 0;
    bySource[s.source].sales++;
    bySource[s.source].revenue += amount;
    const pay = byPayment[s.payment ?? "on_delivery"];
    pay.sales++;
    pay.revenue += amount;
    const row = daily.get(dayOfSqlite(s.delivered_at));
    if (row) {
      row.revenue += amount;
      row.sales++;
    }
  }

  const ids = sales.map((s) => s.id);
  let units = 0;
  const topMap = new Map<string, Report["top"][number]>();
  if (ids.length) {
    const items = d
      .prepare(`SELECT variant_id, name_ar, name_en, label, unit_price, qty FROM order_items WHERE order_id IN (${ids.map(() => "?").join(",")})`)
      .all(...ids) as { variant_id: string; name_ar: string; name_en: string; label: string; unit_price: number | null; qty: number }[];
    for (const i of items) {
      units += i.qty;
      const t = topMap.get(i.variant_id) ?? { name: { ar: i.name_ar, en: i.name_en }, label: i.label, units: 0, revenue: 0 };
      t.units += i.qty;
      t.revenue += (i.unit_price ?? 0) * i.qty;
      topMap.set(i.variant_id, t);
    }
  }
  const top = [...topMap.values()].sort((a, b) => b.revenue - a.revenue || b.units - a.units).slice(0, 10);

  const p = d
    .prepare("SELECT COUNT(*) AS orders, COALESCE(SUM(total), 0) AS revenue FROM orders WHERE status = 'confirmed'")
    .get() as { orders: number; revenue: number };
  // SQLite rows have no prototype: copy into plain objects for the page.
  const pending = { orders: p.orders, revenue: p.revenue };
  const cancelled = (d
    .prepare("SELECT COUNT(*) AS n FROM orders WHERE status = 'cancelled' AND updated_at >= ? AND updated_at < ?")
    .get(start, end) as { n: number }).n;
  const webOrdersPlaced = (d
    .prepare("SELECT COUNT(*) AS n FROM orders WHERE source = 'web' AND created_at >= ? AND created_at < ?")
    .get(start, end) as { n: number }).n;

  const list = (
    d
      .prepare("SELECT id, day, label, category, amount FROM expenses WHERE day >= ? AND day <= ? ORDER BY day DESC, created_at DESC")
      .all(from, to) as unknown as Expense[]
  ).map((e) => ({ id: e.id, day: e.day, label: e.label, category: e.category, amount: e.amount }));
  const expensesTotal = list.reduce((s, e) => s + e.amount, 0);

  for (const r of d.prepare("SELECT day, COUNT(*) AS n FROM visit_days WHERE day >= ? AND day <= ? GROUP BY day").all(from, to) as { day: string; n: number }[]) {
    const row = daily.get(r.day);
    if (row) row.visitors = r.n;
  }
  for (const r of d.prepare("SELECT day, SUM(views) AS n FROM page_views WHERE day >= ? AND day <= ? GROUP BY day").all(from, to) as { day: string; n: number }[]) {
    const row = daily.get(r.day);
    if (row) row.views = r.n;
  }
  const topPages = (
    d
      .prepare("SELECT path, SUM(views) AS views FROM page_views WHERE day >= ? AND day <= ? GROUP BY path ORDER BY views DESC LIMIT 10")
      .all(from, to) as { path: string; views: number }[]
  ).map((r) => ({ path: r.path, views: r.views }));

  const dailyRows = [...daily.values()];
  return {
    from, to, revenue, sales: sales.length, unpriced, units,
    average: sales.length - unpriced > 0 ? Math.round(revenue / (sales.length - unpriced)) : 0,
    discounts, deliveryFees, bySource, byPayment, top, pending, cancelled, webOrdersPlaced,
    expenses: { total: expensesTotal, list },
    profit: revenue - expensesTotal,
    visitors: dailyRows.reduce((s, r) => s + r.visitors, 0),
    views: dailyRows.reduce((s, r) => s + r.views, 0),
    topPages,
    daily: dailyRows,
  };
}

/** Delivered sales of a period, one line per order, for the accountant (CSV). */
export function salesRows(from: string, to: string) {
  const start = sqliteUtc(dayStartUtc(from));
  const end = sqliteUtc(dayStartUtc(addDays(to, 1)));
  return db()
    .prepare(
      `SELECT id, delivered_at, source, payment, name, subtotal, discount, delivery_fee, total, handled_by
       FROM orders WHERE status = 'delivered' AND delivered_at >= ? AND delivered_at < ? ORDER BY delivered_at`,
    )
    .all(start, end) as {
    id: number; delivered_at: string; source: string; payment: string | null; name: string;
    subtotal: number | null; discount: number; delivery_fee: number | null; total: number | null; handled_by: string | null;
  }[];
}

// ---------- Expenses ----------

export const EXPENSE_CATEGORIES = ["stock", "packaging", "transport", "marketing", "rent", "salaries", "other"] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export function addExpense(e: { day: string; label: string; category: ExpenseCategory; amount: number }) {
  db()
    .prepare("INSERT INTO expenses (id, day, label, category, amount) VALUES (?, ?, ?, ?, ?)")
    .run(randomUUID(), e.day, e.label, e.category, e.amount);
}

export function deleteExpense(id: string): boolean {
  return Number(db().prepare("DELETE FROM expenses WHERE id = ?").run(id).changes) > 0;
}
