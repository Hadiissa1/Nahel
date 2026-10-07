import "server-only";
import { db } from "@/lib/db";
import { layout, mailConfigured, sendMail, siteUrl } from "@/lib/mail";

/**
 * Low-stock alerts for the owner: one email when a size drops to the
 * threshold or below, not again until it has gone back above it.
 */

export const DEFAULT_THRESHOLD = 5;

export interface StockSettings {
  threshold: number;
  /** Where alerts are emailed; null = no emails (the admin banner still shows). */
  email: string | null;
}

const meta = (key: string) =>
  (db().prepare("SELECT value FROM meta WHERE key = ?").get(key) as { value: string } | undefined)?.value;

export function getStockSettings(): StockSettings {
  const t = Number(meta("low_stock_threshold"));
  return {
    threshold: Number.isInteger(t) && t >= 0 ? t : DEFAULT_THRESHOLD,
    email: meta("low_stock_email") || null,
  };
}

export function saveStockSettings(s: StockSettings) {
  const set = db().prepare(
    "INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  );
  set.run("low_stock_threshold", String(s.threshold));
  set.run("low_stock_email", s.email ?? "");
}

export interface LowStockItem {
  variantId: string;
  productId: string;
  name: { ar: string; en: string };
  label: string;
  stock: number;
}

interface Row {
  variant_id: string;
  product_id: string;
  name_ar: string;
  name_en: string;
  label: string;
  stock: number;
}

const LOW_SQL = `
  SELECT v.id AS variant_id, p.id AS product_id, p.name_ar, p.name_en, v.label, v.stock
  FROM variants v JOIN products p ON p.id = v.product_id
  WHERE p.visible = 1 AND v.stock IS NOT NULL AND v.stock <= ?`;

const toItem = (r: Row): LowStockItem => ({
  variantId: r.variant_id,
  productId: r.product_id,
  name: { ar: r.name_ar, en: r.name_en },
  label: r.label,
  stock: r.stock,
});

/** Visible sizes at or below the threshold (sold out first). */
export function listLowStock(threshold = getStockSettings().threshold): LowStockItem[] {
  return (db().prepare(`${LOW_SQL} ORDER BY v.stock, p.sort`).all(threshold) as unknown as Row[]).map(toItem);
}

export function countLowStock(): number {
  return listLowStock().length;
}

const line = (i: LowStockItem, lang: "ar" | "en") => {
  const name = (lang === "ar" ? i.name.ar || i.name.en : i.name.en || i.name.ar) + (i.label ? ` (${i.label})` : "");
  const left =
    i.stock <= 0
      ? lang === "ar" ? "نفد" : "sold out"
      : lang === "ar" ? `متبقٍ ${i.stock}` : `${i.stock} left`;
  return `• ${name}: ${left}`;
};

/**
 * Email the owner about sizes that just reached the threshold. Safe to call
 * after every stock change: each size is claimed once until restocked.
 * Returns how many sizes were reported.
 */
export async function checkLowStock(): Promise<number> {
  const d = db();
  const { threshold, email } = getStockSettings();
  // Back above the threshold (or no longer tracked): may alert again later.
  d.prepare("UPDATE variants SET low_alerted = 0 WHERE low_alerted = 1 AND (stock IS NULL OR stock > ?)").run(threshold);
  if (!email || !mailConfigured()) return 0;

  const fresh = (d.prepare(`${LOW_SQL} AND v.low_alerted = 0 ORDER BY v.stock, p.sort`).all(threshold) as unknown as Row[]).map(toItem);
  const claim = d.prepare("UPDATE variants SET low_alerted = 1 WHERE id = ? AND low_alerted = 0");
  const items = fresh.filter((i) => Number(claim.run(i.variantId).changes) > 0); // another process may have taken some
  if (items.length === 0) return 0;

  const admin = `${siteUrl()}/admin`;
  const ar = `مخزون منخفض (الحد: ${threshold}):\n${items.map((i) => line(i, "ar")).join("\n")}`;
  const en = `Low stock (threshold: ${threshold}):\n${items.map((i) => line(i, "en")).join("\n")}`;
  const ok = await sendMail({
    to: email,
    subject: `⚠️ مخزون منخفض · Low stock: ${items.length}`,
    text: `${ar}\n\n${en}\n\n${admin}`,
    html: layout({ lang: "ar", bodyText: `${ar}\n\n${en}`, button: { label: "لوحة الإدارة · Admin", url: admin } }),
  });
  if (!ok) {
    // Let the next stock change try again.
    const unclaim = d.prepare("UPDATE variants SET low_alerted = 0 WHERE id = ?");
    for (const i of items) unclaim.run(i.variantId);
    return 0;
  }
  return items.length;
}
