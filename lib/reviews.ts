import "server-only";
import { randomUUID } from "node:crypto";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import type { RatingSummary, Review } from "@/lib/review-types";

/**
 * Customer reviews. Every review waits for the owner's approval before it
 * appears anywhere (shop, Google data).
 */
export const REVIEWS_TAG = "reviews";

interface Row {
  id: string;
  product_id: string;
  rating: number;
  name: string;
  text: string;
  lang: "ar" | "en";
  approved: number;
  created_at: string;
}

const toReview = (r: Row): Review => ({
  id: r.id,
  rating: r.rating,
  name: r.name,
  text: r.text,
  lang: r.lang,
  date: r.created_at.slice(0, 10),
});

export async function submitReview(input: {
  productId: string;
  rating: number;
  name: string;
  text: string;
  lang: "ar" | "en";
}): Promise<"ok" | "unavailable"> {
  const d = db();
  const p = (await d.prepare("SELECT visible FROM products WHERE id = ?").get(input.productId)) as
    | { visible: number }
    | undefined;
  if (!p || p.visible !== 1) return "unavailable";
  await d.prepare("INSERT INTO reviews (id, product_id, rating, name, text, lang) VALUES (?, ?, ?, ?, ?, ?)").run(
    randomUUID(), input.productId, input.rating, input.name, input.text, input.lang,
  );
  return "ok";
}

/** Approved reviews of a product, newest first. Cached; approving expires it. */
export async function getApprovedReviews(productId: string): Promise<Review[]> {
  "use cache";
  cacheTag(REVIEWS_TAG);
  cacheLife("minutes");
  return (
    (await db()
      .prepare("SELECT * FROM reviews WHERE product_id = ? AND approved = 1 ORDER BY created_at DESC LIMIT 50")
      .all(productId)) as unknown as Row[]
  ).map(toReview);
}

/** Average and count of approved reviews per product (for the catalog). */
export async function ratingSummaries(): Promise<Map<string, RatingSummary>> {
  const rows = (await db()
    .prepare(
      "SELECT product_id, AVG(rating) AS avg, COUNT(*) AS n FROM reviews WHERE approved = 1 GROUP BY product_id",
    )
    .all()) as { product_id: string; avg: number; n: number }[];
  return new Map(rows.map((r) => [r.product_id, { avg: Math.round(r.avg * 10) / 10, count: r.n }]));
}

// ---------- Admin ----------

export interface AdminReview extends Review {
  productId: string;
  productName: { ar: string; en: string };
  approved: boolean;
}

export async function listAdminReviews(): Promise<AdminReview[]> {
  return (
    (await db()
      .prepare(
        `SELECT r.*, p.name_ar, p.name_en FROM reviews r JOIN products p ON p.id = r.product_id
         ORDER BY r.approved, r.created_at DESC LIMIT 500`,
      )
      .all()) as unknown as (Row & { name_ar: string; name_en: string })[]
  ).map((r) => ({
    ...toReview(r),
    productId: r.product_id,
    productName: { ar: r.name_ar, en: r.name_en },
    approved: r.approved === 1,
  }));
}

export async function countPendingReviews(): Promise<number> {
  return ((await db().prepare("SELECT COUNT(*) AS n FROM reviews WHERE approved = 0").get()) as { n: number }).n;
}

export async function setReviewApproved(id: string, approved: boolean): Promise<boolean> {
  return (await db().prepare("UPDATE reviews SET approved = ? WHERE id = ?").run(approved ? 1 : 0, id)).changes > 0;
}

export async function deleteReview(id: string): Promise<boolean> {
  return (await db().prepare("DELETE FROM reviews WHERE id = ?").run(id)).changes > 0;
}
