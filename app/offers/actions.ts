"use server";

import { clientIp, rateLimiter } from "@/lib/rate-limit";
import { mailConfigured } from "@/lib/mail";
import {
  confirmEmail,
  normalizeEmail,
  normalizeWhatsapp,
  subscribe,
  unsubscribe,
} from "@/lib/subscribers";

const perIp = rateLimiter(10, 60 * 60 * 1000);
const siteWide = rateLimiter(300, 60 * 60 * 1000);

export type SubscribeState = {
  done?: "check_inbox" | "subscribed";
  error?: "need_contact" | "invalid_email" | "invalid_whatsapp" | "consent" | "rate";
};

export async function subscribeAction(
  _prev: SubscribeState,
  fd: FormData,
): Promise<SubscribeState> {
  // Honeypot: real people never see or fill this field.
  if (String(fd.get("website") ?? "") !== "") return { done: "subscribed" };

  const email = normalizeEmail(String(fd.get("email") ?? "").slice(0, 300));
  const whatsapp = normalizeWhatsapp(String(fd.get("whatsapp") ?? "").slice(0, 40));
  if (email === "invalid") return { error: "invalid_email" };
  if (whatsapp === "invalid") return { error: "invalid_whatsapp" };
  if (!email && !whatsapp) return { error: "need_contact" };
  if (fd.get("consent") !== "on") return { error: "consent" };

  if (!perIp(await clientIp()) || !siteWide("all")) return { error: "rate" };

  const lang = fd.get("lang") === "en" ? "en" : "ar";
  await subscribe({ email, whatsapp, lang });
  return { done: email && mailConfigured() ? "check_inbox" : "subscribed" };
}

export type TokenState = { result?: "ok" | "invalid" };

export async function confirmAction(_prev: TokenState, fd: FormData): Promise<TokenState> {
  return { result: confirmEmail(String(fd.get("token") ?? "")) ? "ok" : "invalid" };
}

export async function unsubscribeAction(_prev: TokenState, fd: FormData): Promise<TokenState> {
  return { result: unsubscribe(String(fd.get("token") ?? "")) ? "ok" : "invalid" };
}
