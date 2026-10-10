"use server";

import { clientIp, rateLimiter } from "@/lib/rate-limit";
import { normalizeEmail, normalizeWhatsapp } from "@/lib/subscribers";
import { requestAlert } from "@/lib/stock-alerts";

const perIp = rateLimiter("alert-ip", 10, 60 * 60 * 1000);
const siteWide = rateLimiter("alert-all", 500, 60 * 60 * 1000);

export type AlertState = {
  done?: "email" | "whatsapp";
  error?: "contact" | "in_stock" | "unavailable" | "too_many" | "rate";
};

/** "Tell me when it's back": one field that takes an email or a WhatsApp number. */
export async function requestStockAlertAction(_prev: AlertState, fd: FormData): Promise<AlertState> {
  // Honeypot: real people never see or fill this field.
  if (String(fd.get("website") ?? "") !== "") return { done: "email" };

  const contact = String(fd.get("contact") ?? "").trim().slice(0, 300);
  const isEmail = contact.includes("@");
  const email = isEmail ? normalizeEmail(contact) : null;
  const whatsapp = isEmail ? null : normalizeWhatsapp(contact.slice(0, 40));
  if (!email && !whatsapp) return { error: "contact" };
  if (email === "invalid" || whatsapp === "invalid") return { error: "contact" };

  const productId = String(fd.get("product") ?? "").slice(0, 100);
  const variantId = String(fd.get("variant") ?? "").slice(0, 100);
  if (!(await perIp.hit(await clientIp())) || !(await siteWide.hit("all"))) return { error: "rate" };

  const r = await requestAlert({
    productId,
    variantId,
    email,
    whatsapp,
    lang: fd.get("lang") === "en" ? "en" : "ar",
  });
  if (r !== "ok") return { error: r };
  return { done: email ? "email" : "whatsapp" };
}
