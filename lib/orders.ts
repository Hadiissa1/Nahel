import "server-only";
import { db } from "@/lib/db";
import { CONTACT } from "@/lib/config";
import { MAX_CART_QTY, formatPrice } from "@/lib/catalog-types";

export type OrderStatus = "new" | "confirmed" | "delivered" | "cancelled";
export const ORDER_STATUSES: OrderStatus[] = ["new", "confirmed", "delivered", "cancelled"];
export const MAX_ORDER_LINES = 50;

export interface OrderItem {
  productId: string;
  variantId: string;
  name: { ar: string; en: string };
  label: string;
  unitPrice: number | null;
  qty: number;
}

export interface Order {
  id: number;
  status: OrderStatus;
  name: string;
  phone: string;
  address: string;
  note: string;
  lang: "ar" | "en";
  total: number | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface OrderRequest {
  lines: { id: string; variant: string; qty: number }[];
  name: string;
  phone: string;
  address: string;
  note: string;
  lang: "ar" | "en";
}

export type Shortage = { name: { ar: string; en: string }; label: string; available: number };

export type PlaceResult =
  | { ok: true; orderId: number; whatsappUrl: string }
  | { ok: false; error: "empty" | "unavailable"; shortages?: Shortage[] };

interface VariantRow {
  variant_id: string;
  product_id: string;
  label: string;
  price: number | null;
  stock: number | null;
  name_ar: string;
  name_en: string;
  visible: number;
}

function tx<T>(fn: () => T): T {
  const d = db();
  d.exec("BEGIN IMMEDIATE");
  try {
    const out = fn();
    d.exec("COMMIT");
    return out;
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}

const pick = (t: { ar: string; en: string }, lang: "ar" | "en") =>
  t[lang] || t[lang === "ar" ? "en" : "ar"];

const MSG = {
  intro: { ar: "مرحباً نحّال! طلب رقم", en: "Hello Nahel! Order no." },
  total: { ar: "الإجمالي", en: "Total" },
  onRequest: { ar: "السعر عند الطلب", en: "price on request" },
  name: { ar: "الاسم", en: "Name" },
  phone: { ar: "الهاتف", en: "Phone" },
  address: { ar: "العنوان", en: "Address" },
  note: { ar: "ملاحظة", en: "Note" },
};

/** The WhatsApp message the customer sends us; built from server-side data. */
function whatsappMessage(id: number, req: OrderRequest, items: OrderItem[], total: number | null) {
  const L = req.lang;
  const rows = items.map((i) => {
    const name = pick(i.name, L) + (i.label ? ` (${i.label})` : "");
    const price = i.unitPrice !== null ? ` — ${formatPrice(i.unitPrice * i.qty)}` : ` — ${MSG.onRequest[L]}`;
    return `• ${name} ×${i.qty}${price}`;
  });
  const lines = [
    `${MSG.intro[L]} #${id}`,
    "",
    ...rows,
    "",
    total !== null ? `${MSG.total[L]}: ${formatPrice(total)}` : null,
    `${MSG.name[L]}: ${req.name}`,
    `${MSG.phone[L]}: +${req.phone}`,
    req.address ? `${MSG.address[L]}: ${req.address}` : null,
    req.note ? `${MSG.note[L]}: ${req.note}` : null,
  ].filter((l): l is string => l !== null);
  return lines.join("\n");
}

/**
 * Record an order. Everything is re-checked against the database: the
 * product/size must exist and be visible, quantities must be in stock, and
 * names and prices are taken from the database, never from the browser.
 * Stock is NOT reduced here (see setOrderStatus) so fake orders can't empty it.
 */
export function placeOrder(req: OrderRequest): PlaceResult {
  // Merge duplicate lines and keep sane quantities.
  const merged = new Map<string, { id: string; variant: string; qty: number }>();
  for (const l of req.lines.slice(0, MAX_ORDER_LINES)) {
    const k = `${l.id}:${l.variant}`;
    const prev = merged.get(k);
    merged.set(k, { ...l, qty: Math.min(MAX_CART_QTY, (prev?.qty ?? 0) + l.qty) });
  }
  if (merged.size === 0) return { ok: false, error: "empty" };

  return tx(() => {
    const d = db();
    const get = d.prepare(
      `SELECT v.id AS variant_id, v.product_id, v.label, v.price, v.stock,
              p.name_ar, p.name_en, p.visible
       FROM variants v JOIN products p ON p.id = v.product_id
       WHERE v.id = ? AND v.product_id = ?`,
    );
    const items: OrderItem[] = [];
    const shortages: Shortage[] = [];
    for (const l of merged.values()) {
      const row = get.get(l.variant, l.id) as VariantRow | undefined;
      if (!row || row.visible !== 1) return { ok: false as const, error: "unavailable" as const };
      const name = { ar: row.name_ar, en: row.name_en };
      if (row.stock !== null && l.qty > row.stock) {
        shortages.push({ name, label: row.label, available: Math.max(0, row.stock) });
        continue;
      }
      items.push({
        productId: row.product_id,
        variantId: row.variant_id,
        name,
        label: row.label,
        unitPrice: row.price,
        qty: l.qty,
      });
    }
    if (shortages.length) return { ok: false as const, error: "unavailable" as const, shortages };

    const total = items.every((i) => i.unitPrice !== null)
      ? items.reduce((s, i) => s + i.unitPrice! * i.qty, 0)
      : null;
    const r = d
      .prepare(
        "INSERT INTO orders (name, phone, address, note, lang, total) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(req.name, req.phone, req.address, req.note, req.lang, total);
    const orderId = Number(r.lastInsertRowid);
    const insItem = d.prepare(
      `INSERT INTO order_items (order_id, product_id, variant_id, name_ar, name_en, label, unit_price, qty)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const i of items) {
      insItem.run(orderId, i.productId, i.variantId, i.name.ar, i.name.en, i.label, i.unitPrice, i.qty);
    }
    const text = whatsappMessage(orderId, req, items, total);
    return {
      ok: true as const,
      orderId,
      whatsappUrl: `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`,
    };
  });
}

// ---------- Admin ----------

interface OrderRow {
  id: number;
  status: OrderStatus;
  name: string;
  phone: string;
  address: string;
  note: string;
  lang: "ar" | "en";
  total: number | null;
  stock_applied: number;
  created_at: string;
  updated_at: string;
}
interface ItemRow {
  order_id: number;
  product_id: string;
  variant_id: string;
  name_ar: string;
  name_en: string;
  label: string;
  unit_price: number | null;
  qty: number;
}

export function listOrders(limit = 300): Order[] {
  const d = db();
  const rows = d
    .prepare("SELECT * FROM orders ORDER BY id DESC LIMIT ?")
    .all(limit) as unknown as OrderRow[];
  if (!rows.length) return [];
  const items = d
    .prepare(
      `SELECT * FROM order_items WHERE order_id IN (${rows.map(() => "?").join(",")}) ORDER BY id`,
    )
    .all(...rows.map((r) => r.id)) as unknown as ItemRow[];
  const byOrder = new Map<number, OrderItem[]>();
  for (const i of items) {
    const list = byOrder.get(i.order_id) ?? [];
    list.push({
      productId: i.product_id,
      variantId: i.variant_id,
      name: { ar: i.name_ar, en: i.name_en },
      label: i.label,
      unitPrice: i.unit_price,
      qty: i.qty,
    });
    byOrder.set(i.order_id, list);
  }
  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    name: r.name,
    phone: r.phone,
    address: r.address,
    note: r.note,
    lang: r.lang,
    total: r.total,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    items: byOrder.get(r.id) ?? [],
  }));
}

export function countNewOrders(): number {
  return (db().prepare("SELECT COUNT(*) AS n FROM orders WHERE status = 'new'").get() as { n: number }).n;
}

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ["confirmed", "cancelled"],
  confirmed: ["delivered", "cancelled"],
  delivered: [],
  cancelled: ["new"],
};

export type StatusResult =
  | { ok: true; stockChanged: boolean }
  | { ok: false; error: "not_found" | "transition" }
  | { ok: false; error: "shortage"; shortages: Shortage[] };

/**
 * Move an order to a new status.
 * - Confirming takes the quantities out of stock (all or nothing: if any
 *   size lacks stock, nothing changes and the shortages are reported).
 * - Cancelling a confirmed order puts the quantities back.
 * The `stock_applied` flag guarantees stock moves at most once per order.
 */
export function setOrderStatus(id: number, next: OrderStatus): StatusResult {
  return tx(() => {
    const d = db();
    const order = d.prepare("SELECT * FROM orders WHERE id = ?").get(id) as OrderRow | undefined;
    if (!order) return { ok: false as const, error: "not_found" as const };
    if (!TRANSITIONS[order.status].includes(next)) return { ok: false as const, error: "transition" as const };

    const items = d.prepare("SELECT * FROM order_items WHERE order_id = ?").all(id) as unknown as ItemRow[];
    const getStock = d.prepare("SELECT stock FROM variants WHERE id = ?");
    let stockChanged = false;

    if (next === "confirmed" && !order.stock_applied) {
      // Several lines may target the same size: compare totals.
      const need = new Map<string, number>();
      for (const i of items) need.set(i.variant_id, (need.get(i.variant_id) ?? 0) + i.qty);
      const shortages: Shortage[] = [];
      for (const [variantId, qty] of need) {
        const v = getStock.get(variantId) as { stock: number | null } | undefined;
        if (v && v.stock !== null && v.stock < qty) {
          const i = items.find((x) => x.variant_id === variantId)!;
          shortages.push({ name: { ar: i.name_ar, en: i.name_en }, label: i.label, available: Math.max(0, v.stock) });
        }
      }
      if (shortages.length) return { ok: false as const, error: "shortage" as const, shortages };
      const dec = d.prepare("UPDATE variants SET stock = stock - ? WHERE id = ? AND stock IS NOT NULL");
      for (const [variantId, qty] of need) stockChanged = Number(dec.run(qty, variantId).changes) > 0 || stockChanged;
      d.prepare("UPDATE orders SET stock_applied = 1 WHERE id = ?").run(id);
    }

    if (next === "cancelled" && order.stock_applied) {
      // Sizes deleted since then are simply skipped.
      const inc = d.prepare("UPDATE variants SET stock = stock + ? WHERE id = ? AND stock IS NOT NULL");
      for (const i of items) stockChanged = Number(inc.run(i.qty, i.variant_id).changes) > 0 || stockChanged;
      d.prepare("UPDATE orders SET stock_applied = 0 WHERE id = ?").run(id);
    }

    d.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(next, id);
    return { ok: true as const, stockChanged };
  });
}

/** Only cancelled orders can be deleted (e.g. spam). */
export function deleteOrder(id: number): boolean {
  const r = db().prepare("DELETE FROM orders WHERE id = ? AND status = 'cancelled'").run(id);
  return Number(r.changes) > 0;
}
