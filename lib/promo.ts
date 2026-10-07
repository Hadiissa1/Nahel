import "server-only";
import { db } from "@/lib/db";
import { SHOP_TIME_ZONE } from "@/lib/config";
import type { PromoError, PromoRule } from "@/lib/promo-types";

export interface PromoCode extends PromoRule {
  /** Last valid day (YYYY-MM-DD, shop time zone), or null. */
  expiresOn: string | null;
  maxUses: number | null;
  /** Confirmed orders that used the code. */
  uses: number;
  active: boolean;
  status: "active" | "paused" | "expired" | "used_up";
  createdAt: string;
}

interface Row {
  code: string;
  kind: "percent" | "amount";
  value: number;
  min_total: number | null;
  expires_on: string | null;
  max_uses: number | null;
  uses: number;
  active: number;
  created_at: string;
}

/** Today's date in the shop's time zone, as YYYY-MM-DD. */
export function shopToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: SHOP_TIME_ZONE }).format(new Date());
}

function toCode(r: Row, today: string): PromoCode {
  const status = !r.active
    ? "paused"
    : r.expires_on && r.expires_on < today
      ? "expired"
      : r.max_uses !== null && r.uses >= r.max_uses
        ? "used_up"
        : "active";
  return {
    code: r.code,
    kind: r.kind,
    value: r.value,
    minTotal: r.min_total,
    expiresOn: r.expires_on,
    maxUses: r.max_uses,
    uses: r.uses,
    active: r.active === 1,
    status,
    createdAt: r.created_at,
  };
}

/**
 * The rule for a code customers may use right now. A paused code reads as
 * "not found" so customers can't tell paused codes from made-up ones.
 */
export function findUsablePromo(code: string): { rule: PromoRule } | { error: PromoError } {
  const row = db().prepare("SELECT * FROM promo_codes WHERE code = ?").get(code) as Row | undefined;
  if (!row) return { error: "not_found" };
  const c = toCode(row, shopToday());
  if (c.status === "paused") return { error: "not_found" };
  if (c.status === "expired") return { error: "expired" };
  if (c.status === "used_up") return { error: "used_up" };
  return { rule: { code: c.code, kind: c.kind, value: c.value, minTotal: c.minTotal } };
}

// ---------- Admin ----------

export function listPromoCodes(): PromoCode[] {
  const today = shopToday();
  return (db().prepare("SELECT * FROM promo_codes ORDER BY created_at DESC, code").all() as unknown as Row[]).map(
    (r) => toCode(r, today),
  );
}

export interface PromoInput {
  code: string;
  kind: "percent" | "amount";
  value: number;
  minTotal: number | null;
  expiresOn: string | null;
  maxUses: number | null;
}

export function createPromoCode(p: PromoInput): "ok" | "taken" {
  const r = db()
    .prepare(
      `INSERT INTO promo_codes (code, kind, value, min_total, expires_on, max_uses)
       VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(code) DO NOTHING`,
    )
    .run(p.code, p.kind, p.value, p.minTotal, p.expiresOn, p.maxUses);
  return Number(r.changes) > 0 ? "ok" : "taken";
}

export function setPromoActive(code: string, active: boolean): boolean {
  const r = db().prepare("UPDATE promo_codes SET active = ? WHERE code = ?").run(active ? 1 : 0, code);
  return Number(r.changes) > 0;
}

export function deletePromoCode(code: string): boolean {
  return Number(db().prepare("DELETE FROM promo_codes WHERE code = ?").run(code).changes) > 0;
}
