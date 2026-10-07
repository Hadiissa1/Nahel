import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { layout, mailConfigured, sendMail, siteUrl } from "@/lib/mail";

/**
 * "Tell me when it's back" requests, one per size and contact.
 * - Email: sent automatically once the size is in stock again, then deleted.
 * - WhatsApp: listed in the admin (no automatic sending), deleted once handled.
 */

/** Pending requests per address, across all products (limits abuse). */
export const MAX_ALERTS_PER_CONTACT = 20;

export type AlertResult = "ok" | "in_stock" | "unavailable" | "too_many";

interface VariantRow {
  stock: number | null;
  visible: number;
}

/** A size is "available" when visible and not out of stock. */
const AVAILABLE = "p.visible = 1 AND (v.stock IS NULL OR v.stock > 0)";

export function requestAlert(input: {
  productId: string;
  variantId: string;
  email: string | null;
  whatsapp: string | null;
  lang: "ar" | "en";
}): AlertResult {
  const d = db();
  const v = d
    .prepare(
      `SELECT v.stock, p.visible FROM variants v JOIN products p ON p.id = v.product_id
       WHERE v.id = ? AND v.product_id = ?`,
    )
    .get(input.variantId, input.productId) as VariantRow | undefined;
  if (!v || v.visible !== 1) return "unavailable";
  if (v.stock === null || v.stock > 0) return "in_stock";

  const count = (col: "email" | "whatsapp", value: string | null) =>
    value
      ? (d.prepare(`SELECT COUNT(*) AS n FROM stock_alerts WHERE ${col} = ?`).get(value) as { n: number }).n
      : 0;
  if (count("email", input.email) >= MAX_ALERTS_PER_CONTACT || count("whatsapp", input.whatsapp) >= MAX_ALERTS_PER_CONTACT)
    return "too_many";

  // Same answer whether or not the request already existed (no information leak).
  const ins = d.prepare(
    "INSERT INTO stock_alerts (id, variant_id, email, whatsapp, lang) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING",
  );
  if (input.email) ins.run(randomUUID(), input.variantId, input.email, null, input.lang);
  if (input.whatsapp) ins.run(randomUUID(), input.variantId, null, input.whatsapp, input.lang);
  return "ok";
}

interface ReadyRow {
  id: string;
  email: string | null;
  whatsapp: string | null;
  lang: "ar" | "en";
  product_id: string;
  name_ar: string;
  name_en: string;
  label: string;
}

const READY_SQL = `
  SELECT a.id, a.email, a.whatsapp, a.lang, p.id AS product_id, p.name_ar, p.name_en, v.label
  FROM stock_alerts a JOIN variants v ON v.id = a.variant_id JOIN products p ON p.id = v.product_id
  WHERE ${AVAILABLE}`;

const pick = (r: { name_ar: string; name_en: string }, lang: "ar" | "en") =>
  (lang === "ar" ? r.name_ar || r.name_en : r.name_en || r.name_ar) ;

export function productUrl(productId: string) {
  return `${siteUrl()}/product/${encodeURIComponent(productId)}`;
}

const TEXT = {
  subject: { ar: "عاد إلى المخزون: {p}", en: "Back in stock: {p}" },
  body: {
    ar: "خبر سار! {p} متوفر من جديد في نحّال.\nالكمية محدودة، اطلبه قبل نفاده.",
    en: "Good news! {p} is available again at Nahel.\nQuantities are limited, order before it runs out.",
  },
  button: { ar: "اطلب الآن", en: "Order now" },
  footer: {
    ar: "تلقيت هذه الرسالة لأنك طلبت إعلامك بعودة هذا المنتج. إنها رسالة واحدة فقط، وقد حُذف عنوانك من هذه القائمة.",
    en: "You asked to be told when this product was back. This is a one-time message; your address has been removed from this list.",
  },
  whatsapp: {
    ar: "مرحباً! {p} متوفر من جديد في نحّال 🍯\n{u}",
    en: "Hello! {p} is back in stock at Nahel 🍯\n{u}",
  },
};

const fullName = (r: ReadyRow, lang: "ar" | "en") => pick(r, lang) + (r.label ? ` (${r.label})` : "");

/**
 * Email everyone whose size is back in stock. Safe to call often and from
 * several processes at once: each request is claimed before sending.
 * Returns how many emails were sent.
 */
export async function sendRestockEmails(): Promise<number> {
  if (!mailConfigured()) return 0;
  const d = db();
  // Claims older than 10 minutes are from a crashed attempt: retry them.
  const rows = d
    .prepare(
      `${READY_SQL} AND a.email IS NOT NULL
       AND (a.sending_at IS NULL OR a.sending_at < datetime('now', '-10 minutes'))
       LIMIT 500`,
    )
    .all() as unknown as ReadyRow[];
  let sent = 0;
  for (const r of rows) {
    const claim = d
      .prepare(
        `UPDATE stock_alerts SET sending_at = datetime('now')
         WHERE id = ? AND (sending_at IS NULL OR sending_at < datetime('now', '-10 minutes'))`,
      )
      .run(r.id);
    if (Number(claim.changes) === 0) continue; // another process took it
    const name = fullName(r, r.lang);
    const ok = await sendMail({
      to: r.email!,
      subject: TEXT.subject[r.lang].replace("{p}", name),
      text: `${TEXT.body[r.lang].replace("{p}", name)}\n\n${productUrl(r.product_id)}\n\n${TEXT.footer[r.lang]}`,
      html: layout({
        lang: r.lang,
        bodyText: TEXT.body[r.lang].replace("{p}", name),
        button: { label: TEXT.button[r.lang], url: productUrl(r.product_id) },
        footerHtml: TEXT.footer[r.lang],
      }),
    });
    if (ok) {
      d.prepare("DELETE FROM stock_alerts WHERE id = ?").run(r.id);
      sent++;
    } else {
      d.prepare("UPDATE stock_alerts SET sending_at = NULL WHERE id = ?").run(r.id);
    }
  }
  return sent;
}

// ---------- Admin ----------

export interface ReadyAlert {
  id: string;
  /** "whatsapp" (to send by hand) or "email" (waiting for email to be set up). */
  channel: "whatsapp" | "email";
  contact: string;
  lang: "ar" | "en";
  productName: string;
  /** wa.me link with the message ready (WhatsApp only). */
  whatsappUrl: string | null;
}

export interface WaitingGroup {
  productId: string;
  name: { ar: string; en: string };
  label: string;
  emails: number;
  whatsapps: number;
}

/** Requests whose size is back in stock and still need a manual action. */
export function listReadyAlerts(): ReadyAlert[] {
  const rows = db()
    .prepare(`${READY_SQL} ORDER BY a.created_at`)
    .all() as unknown as ReadyRow[];
  const email = mailConfigured();
  return rows
    .filter((r) => r.whatsapp || !email)
    .map((r) => {
      const name = fullName(r, r.lang);
      return {
        id: r.id,
        channel: r.whatsapp ? ("whatsapp" as const) : ("email" as const),
        contact: (r.whatsapp ?? r.email)!,
        lang: r.lang,
        productName: name,
        whatsappUrl: r.whatsapp
          ? `https://wa.me/${r.whatsapp}?text=${encodeURIComponent(
              TEXT.whatsapp[r.lang].replace("{p}", name).replace("{u}", productUrl(r.product_id)),
            )}`
          : null,
      };
    });
}

/** Demand for sizes still out of stock. */
export function listWaiting(): WaitingGroup[] {
  return (
    db()
      .prepare(
        `SELECT p.id AS product_id, p.name_ar, p.name_en, v.label,
                COUNT(a.email) AS emails, COUNT(a.whatsapp) AS whatsapps
         FROM stock_alerts a JOIN variants v ON v.id = a.variant_id JOIN products p ON p.id = v.product_id
         WHERE NOT (${AVAILABLE})
         GROUP BY v.id ORDER BY COUNT(*) DESC, p.sort`,
      )
      .all() as unknown as (Omit<WaitingGroup, "name" | "productId"> & { product_id: string; name_ar: string; name_en: string })[]
  ).map((r) => ({
    productId: r.product_id,
    name: { ar: r.name_ar, en: r.name_en },
    label: r.label,
    emails: r.emails,
    whatsapps: r.whatsapps,
  }));
}

export function countReadyAlerts(): number {
  return listReadyAlerts().length;
}

export function deleteAlert(id: string): boolean {
  return Number(db().prepare("DELETE FROM stock_alerts WHERE id = ?").run(id).changes) > 0;
}
