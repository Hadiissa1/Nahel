import "server-only";
import { db } from "@/lib/db";
import { CONTACT } from "@/lib/config";
import { MAX_CART_QTY, formatPrice } from "@/lib/catalog-types";
import { findUsablePromo } from "@/lib/promo";
import { activeZones } from "@/lib/delivery";
import { deliveryFee } from "@/lib/delivery-types";
import { computeDiscount, type PromoError } from "@/lib/promo-types";

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
  /** Before the promo code discount (null on orders from before codes existed). */
  subtotal: number | null;
  promoCode: string | null;
  discount: number;
  /** Delivery area name at the time of the order, or null. */
  zone: { ar: string; en: string } | null;
  /** Delivery fee in cents; null = to confirm (or no zone). */
  deliveryFee: number | null;
  /** Staff member who last changed the status (null = owner or nobody yet). */
  handledBy: string | null;
  /** "web" = placed on the site, "counter" = sold in person (till). */
  source: "web" | "counter";
  payment: "cash" | "card" | "whish" | null;
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
  /** Normalized promo code, if the customer entered one. */
  promo?: string;
  /** Chosen delivery zone id (required while zones are set up). */
  zone?: string;
}

export type Shortage = { name: { ar: string; en: string }; label: string; available: number };

export type PlaceResult =
  | { ok: true; orderId: number; whatsappUrl: string }
  | { ok: false; error: "empty" | "unavailable" | "zone"; shortages?: Shortage[] }
  | { ok: false; error: "promo"; promoError: PromoError; minTotal?: number };

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
  subtotal: { ar: "المجموع", en: "Subtotal" },
  code: { ar: "كود الخصم", en: "Promo code" },
  delivery: { ar: "التوصيل", en: "Delivery" },
  free: { ar: "مجاني", en: "free" },
  toConfirm: { ar: "يُحدَّد معكم", en: "to be confirmed" },
  total: { ar: "الإجمالي", en: "Total" },
  onRequest: { ar: "السعر عند الطلب", en: "price on request" },
  name: { ar: "الاسم", en: "Name" },
  phone: { ar: "الهاتف", en: "Phone" },
  address: { ar: "العنوان", en: "Address" },
  note: { ar: "ملاحظة", en: "Note" },
};

/** The WhatsApp message the customer sends us; built from server-side data. */
function whatsappMessage(
  id: number,
  req: OrderRequest,
  items: OrderItem[],
  total: number | null,
  promo: { code: string; subtotal: number; discount: number } | null,
  delivery: { name: { ar: string; en: string }; fee: number | null } | null,
) {
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
    promo ? `${MSG.subtotal[L]}: ${formatPrice(promo.subtotal)}` : null,
    promo ? `${MSG.code[L]} ${promo.code}: -${formatPrice(promo.discount)}` : null,
    delivery
      ? `${MSG.delivery[L]} (${pick(delivery.name, L)}): ${
          delivery.fee === null ? MSG.toConfirm[L] : delivery.fee === 0 ? MSG.free[L] : formatPrice(delivery.fee)
        }`
      : null,
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

  // While delivery zones are set up, the customer must pick an active one.
  const zones = activeZones();
  const zone = zones.find((z) => z.id === req.zone);
  if (zones.length > 0 && !zone) return { ok: false, error: "zone" };

  return tx(() => {
    const d = db();
    const get = d.prepare(
      `SELECT v.id AS variant_id, v.product_id, v.label,
              CASE WHEN v.sale_price IS NOT NULL AND v.price IS NOT NULL AND v.sale_price < v.price
                   THEN v.sale_price ELSE v.price END AS price,
              v.stock,
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

    const subtotal = items.every((i) => i.unitPrice !== null)
      ? items.reduce((s, i) => s + i.unitPrice! * i.qty, 0)
      : null;

    // Promo code: checked again here, whatever the cart showed.
    let promo: { code: string; subtotal: number; discount: number } | null = null;
    if (req.promo) {
      const found = findUsablePromo(req.promo);
      if ("error" in found) return { ok: false as const, error: "promo" as const, promoError: found.error };
      if (subtotal === null) return { ok: false as const, error: "promo" as const, promoError: "needs_prices" as const };
      if (found.rule.minTotal !== null && subtotal < found.rule.minTotal) {
        return { ok: false as const, error: "promo" as const, promoError: "min_total" as const, minTotal: found.rule.minTotal };
      }
      promo = { code: found.rule.code, subtotal, discount: computeDiscount(found.rule, subtotal) };
    }
    const goods = subtotal === null ? null : subtotal - (promo?.discount ?? 0);
    const fee = zone ? deliveryFee(zone, goods) : null;
    // An unknown fee ("to be confirmed") isn't added; the message says so.
    const total = goods === null ? null : goods + (fee ?? 0);

    const r = d
      .prepare(
        `INSERT INTO orders (name, phone, address, note, lang, subtotal, promo_code, discount,
           zone_ar, zone_en, delivery_fee, total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        req.name, req.phone, req.address, req.note, req.lang, subtotal, promo?.code ?? null,
        promo?.discount ?? 0, zone?.name.ar ?? null, zone?.name.en ?? null, fee, total,
      );
    const orderId = Number(r.lastInsertRowid);
    const insItem = d.prepare(
      `INSERT INTO order_items (order_id, product_id, variant_id, name_ar, name_en, label, unit_price, qty)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const i of items) {
      insItem.run(orderId, i.productId, i.variantId, i.name.ar, i.name.en, i.label, i.unitPrice, i.qty);
    }
    const text = whatsappMessage(orderId, req, items, total, promo, zone ? { name: zone.name, fee } : null);
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
  subtotal: number | null;
  promo_code: string | null;
  discount: number;
  promo_counted: number;
  zone_ar: string | null;
  zone_en: string | null;
  delivery_fee: number | null;
  handled_by: string | null;
  source: "web" | "counter";
  payment: "cash" | "card" | "whish" | null;
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
    subtotal: r.subtotal,
    promoCode: r.promo_code,
    discount: r.discount,
    zone: r.zone_ar !== null || r.zone_en !== null ? { ar: r.zone_ar ?? "", en: r.zone_en ?? "" } : null,
    deliveryFee: r.delivery_fee,
    handledBy: r.handled_by,
    source: r.source,
    payment: r.payment,
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
 * A promo code's use is counted on confirmation too (and given back on
 * cancellation), so unconfirmed fake orders can't use up a code.
 */
/** `by`: staff member's name (null = the owner), recorded on the order. */
export function setOrderStatus(id: number, next: OrderStatus, by: string | null = null): StatusResult {
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
    if (next === "confirmed" && order.promo_code && !order.promo_counted) {
      d.prepare("UPDATE promo_codes SET uses = uses + 1 WHERE code = ?").run(order.promo_code);
      d.prepare("UPDATE orders SET promo_counted = 1 WHERE id = ?").run(id);
    }

    if (next === "cancelled" && order.stock_applied) {
      // Sizes deleted since then are simply skipped.
      const inc = d.prepare("UPDATE variants SET stock = stock + ? WHERE id = ? AND stock IS NOT NULL");
      for (const i of items) stockChanged = Number(inc.run(i.qty, i.variant_id).changes) > 0 || stockChanged;
      d.prepare("UPDATE orders SET stock_applied = 0 WHERE id = ?").run(id);
    }
    if (next === "cancelled" && order.promo_counted) {
      d.prepare("UPDATE promo_codes SET uses = MAX(0, uses - 1) WHERE code = ?").run(order.promo_code);
      d.prepare("UPDATE orders SET promo_counted = 0 WHERE id = ?").run(id);
    }

    d.prepare(
      `UPDATE orders SET status = ?, handled_by = ?, updated_at = datetime('now'),
         -- Dates used by the finance reports (a sale counts on the day it was delivered).
         confirmed_at = CASE WHEN ? = 'confirmed' THEN datetime('now') WHEN ? = 'new' THEN NULL ELSE confirmed_at END,
         delivered_at = CASE WHEN ? = 'delivered' THEN datetime('now') ELSE NULL END
       WHERE id = ?`,
    ).run(next, by, next, next, next, id);
    return { ok: true as const, stockChanged };
  });
}

/** Only cancelled orders can be deleted (e.g. spam). */
export function deleteOrder(id: number): boolean {
  const r = db().prepare("DELETE FROM orders WHERE id = ? AND status = 'cancelled'").run(id);
  return Number(r.changes) > 0;
}

// ---------- Counter sales (till) ----------

export type Payment = "cash" | "card" | "whish";
export const PAYMENTS: Payment[] = ["cash", "card", "whish"];

export type CounterResult =
  | { ok: true; orderId: number; subtotal: number; discount: number; total: number }
  | { ok: false; error: "empty" | "unavailable" | "no_price" | "discount"; shortages?: Shortage[] };

/**
 * A sale made in person (shop, market): recorded as an order that is already
 * delivered and paid, its stock taken at once (all or nothing). Prices come
 * from the database (sale prices included), never from the browser.
 */
export function recordCounterSale(input: {
  lines: { id: string; variant: string; qty: number }[];
  /** Optional discount: a percent (0–100) or an amount in cents. */
  discount: { kind: "percent" | "amount"; value: number } | null;
  payment: Payment;
  customer: string;
  by: string | null;
}): CounterResult {
  const merged = new Map<string, { id: string; variant: string; qty: number }>();
  for (const l of input.lines.slice(0, MAX_ORDER_LINES)) {
    const k = `${l.id}:${l.variant}`;
    merged.set(k, { ...l, qty: Math.min(9999, (merged.get(k)?.qty ?? 0) + l.qty) });
  }
  if (merged.size === 0) return { ok: false, error: "empty" };

  return tx(() => {
    const d = db();
    const get = d.prepare(
      `SELECT v.id AS variant_id, v.product_id, v.label,
              CASE WHEN v.sale_price IS NOT NULL AND v.price IS NOT NULL AND v.sale_price < v.price
                   THEN v.sale_price ELSE v.price END AS price,
              v.stock, p.name_ar, p.name_en, p.visible
       FROM variants v JOIN products p ON p.id = v.product_id
       WHERE v.id = ? AND v.product_id = ?`,
    );
    const items: OrderItem[] = [];
    const shortages: Shortage[] = [];
    for (const l of merged.values()) {
      const row = get.get(l.variant, l.id) as VariantRow | undefined;
      if (!row) return { ok: false as const, error: "unavailable" as const };
      if (row.price === null) return { ok: false as const, error: "no_price" as const };
      const name = { ar: row.name_ar, en: row.name_en };
      if (row.stock !== null && l.qty > row.stock) {
        shortages.push({ name, label: row.label, available: Math.max(0, row.stock) });
        continue;
      }
      items.push({ productId: row.product_id, variantId: row.variant_id, name, label: row.label, unitPrice: row.price, qty: l.qty });
    }
    if (shortages.length) return { ok: false as const, error: "unavailable" as const, shortages };

    const subtotal = items.reduce((s, i) => s + i.unitPrice! * i.qty, 0);
    const dsc = input.discount;
    const discount = !dsc ? 0 : dsc.kind === "percent" ? Math.round((subtotal * dsc.value) / 100) : dsc.value;
    if (dsc && (dsc.value < 0 || (dsc.kind === "percent" && dsc.value > 100) || discount > subtotal)) {
      return { ok: false as const, error: "discount" as const };
    }
    const total = subtotal - discount;

    const r = d
      .prepare(
        `INSERT INTO orders (status, name, phone, lang, subtotal, discount, total, stock_applied, source, payment,
           handled_by, confirmed_at, delivered_at)
         VALUES ('delivered', ?, '', 'ar', ?, ?, ?, 1, 'counter', ?, ?, datetime('now'), datetime('now'))`,
      )
      .run(input.customer, subtotal, discount, total, input.payment, input.by);
    const orderId = Number(r.lastInsertRowid);
    const insItem = d.prepare(
      `INSERT INTO order_items (order_id, product_id, variant_id, name_ar, name_en, label, unit_price, qty)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const dec = d.prepare("UPDATE variants SET stock = stock - ? WHERE id = ? AND stock IS NOT NULL");
    for (const i of items) {
      insItem.run(orderId, i.productId, i.variantId, i.name.ar, i.name.en, i.label, i.unitPrice, i.qty);
      dec.run(i.qty, i.variantId);
    }
    return { ok: true as const, orderId, subtotal, discount, total };
  });
}
