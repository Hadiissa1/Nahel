/** Promo code rules shared by the server and the cart (no secrets here). */

export interface PromoRule {
  code: string;
  kind: "percent" | "amount";
  /** Percent (1–90) or amount in cents. */
  value: number;
  /** Minimum subtotal in cents, or null. */
  minTotal: number | null;
}

export type PromoError = "not_found" | "expired" | "used_up" | "min_total" | "needs_prices";

export const MAX_PERCENT = 90;
export const CODE_PATTERN = /^[A-Z0-9_-]{3,20}$/;

/** Upper-case, trimmed code, or null when it can't be a valid code. */
export function normalizeCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  return CODE_PATTERN.test(code) ? code : null;
}

/** Discount in cents for a subtotal; never more than the subtotal. */
export function computeDiscount(rule: PromoRule, subtotal: number): number {
  const d =
    rule.kind === "percent"
      ? Math.round((subtotal * Math.min(rule.value, MAX_PERCENT)) / 100)
      : rule.value;
  return Math.max(0, Math.min(subtotal, d));
}
