"use server";

import { clientIp, rateLimiter } from "@/lib/rate-limit";
import { submitReview } from "@/lib/reviews";
import { REVIEW_LIMITS } from "@/lib/review-types";

const perIp = rateLimiter(5, 60 * 60 * 1000);
const siteWide = rateLimiter(200, 60 * 60 * 1000);

export type ReviewState = {
  done?: boolean;
  error?: "rating" | "name" | "text_short" | "too_long" | "unavailable" | "rate";
};

const clean = (v: FormDataEntryValue | null) =>
  String(v ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export async function submitReviewAction(_prev: ReviewState, fd: FormData): Promise<ReviewState> {
  // Honeypot: pretend it worked for bots.
  if (String(fd.get("website") ?? "") !== "") return { done: true };

  const rating = Number(fd.get("rating"));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: "rating" };
  const name = clean(fd.get("name")).replace(/\n/g, " ");
  const text = clean(fd.get("text"));
  if (name.length < 2) return { error: "name" };
  if (text.length < REVIEW_LIMITS.textMin) return { error: "text_short" };
  if (name.length > REVIEW_LIMITS.name || text.length > REVIEW_LIMITS.textMax) return { error: "too_long" };

  if (!perIp(await clientIp()) || !siteWide("all")) return { error: "rate" };

  const r = submitReview({
    productId: String(fd.get("product") ?? "").slice(0, 100),
    rating,
    name,
    text,
    lang: fd.get("lang") === "en" ? "en" : "ar",
  });
  return r === "ok" ? { done: true } : { error: r };
}
