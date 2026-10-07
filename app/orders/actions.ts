"use server";

import { updateTag } from "next/cache";
import { clientIp, rateLimiter } from "@/lib/rate-limit";
import { normalizeWhatsapp } from "@/lib/subscribers";
import { MAX_CART_QTY } from "@/lib/catalog-types";
import { MAX_ORDER_LINES, placeOrder, type OrderRequest, type Shortage } from "@/lib/orders";
import { PRODUCTS_TAG } from "@/lib/products";
import { findUsablePromo } from "@/lib/promo";
import { normalizeCode, type PromoError, type PromoRule } from "@/lib/promo-types";

const perIp = rateLimiter(10, 60 * 60 * 1000);
const siteWide = rateLimiter(300, 60 * 60 * 1000);
// Code checks: enough for real customers, too few to guess codes by trying.
const promoPerIp = rateLimiter(15, 10 * 60 * 1000);
const promoSiteWide = rateLimiter(3000, 10 * 60 * 1000);

export type OrderState = {
  done?: { orderId: number; whatsappUrl: string };
  error?: "name" | "phone" | "too_long" | "empty" | "unavailable" | "rate" | "promo";
  shortages?: Shortage[];
  promoError?: PromoError;
  minTotal?: number;
};

const clean = (v: FormDataEntryValue | null, max: number) =>
  String(v ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max + 1);

function parseLines(raw: string): OrderRequest["lines"] | null {
  if (raw.length > 20_000) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(data) || data.length === 0 || data.length > MAX_ORDER_LINES) return null;
  const out: OrderRequest["lines"] = [];
  for (const l of data) {
    if (!l || typeof l !== "object") return null;
    const { id, variant, qty } = l as Record<string, unknown>;
    if (typeof id !== "string" || typeof variant !== "string" || id.length > 100 || variant.length > 100)
      return null;
    if (typeof qty !== "number" || !Number.isInteger(qty) || qty < 1 || qty > MAX_CART_QTY) return null;
    out.push({ id, variant, qty });
  }
  return out;
}

export async function placeOrderAction(_prev: OrderState, fd: FormData): Promise<OrderState> {
  // Honeypot: pretend to fail quietly for bots.
  if (String(fd.get("website") ?? "") !== "") return { error: "rate" };

  const lines = parseLines(String(fd.get("lines") ?? ""));
  if (!lines) return { error: "empty" };
  const name = clean(fd.get("name"), 80);
  const address = clean(fd.get("address"), 300);
  const note = clean(fd.get("note"), 500);
  if (name.length < 2) return { error: "name" };
  if (name.length > 80 || address.length > 300 || note.length > 500) return { error: "too_long" };
  const phone = normalizeWhatsapp(String(fd.get("phone") ?? "").slice(0, 40));
  if (!phone || phone === "invalid") return { error: "phone" };
  const rawPromo = String(fd.get("promo") ?? "");
  const promo = rawPromo ? normalizeCode(rawPromo) : undefined;
  if (promo === null) return { error: "promo", promoError: "not_found" };

  if (!perIp(await clientIp()) || !siteWide("all")) return { error: "rate" };

  const result = placeOrder({
    lines,
    name,
    phone,
    address,
    note,
    lang: fd.get("lang") === "en" ? "en" : "ar",
    promo,
  });
  if (!result.ok) {
    if (result.error === "promo") {
      return { error: "promo", promoError: result.promoError, minTotal: result.minTotal };
    }
    // Stock or availability changed since the page loaded: refresh the shop.
    if (result.error === "unavailable") updateTag(PRODUCTS_TAG);
    return { error: result.error, shortages: result.shortages };
  }
  return { done: { orderId: result.orderId, whatsappUrl: result.whatsappUrl } };
}

export type PromoCheck = { rule: PromoRule } | { error: PromoError | "rate" };

/**
 * Look up a promo code for the cart. Only says whether the code exists and
 * what it gives: minimum total and prices are checked again when ordering.
 */
export async function checkPromoAction(raw: string): Promise<PromoCheck> {
  if (typeof raw !== "string" || raw.length > 40) return { error: "not_found" };
  if (!promoPerIp(await clientIp()) || !promoSiteWide("all")) return { error: "rate" };
  const code = normalizeCode(raw);
  if (!code) return { error: "not_found" };
  return findUsablePromo(code);
}
