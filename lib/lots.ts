import "server-only";
import { randomUUID } from "node:crypto";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { docUrl, type AdminLot, type Lot } from "@/lib/lot-types";

export const LOTS_TAG = "lots";

interface Row {
  id: string;
  code: string;
  product_id: string;
  harvest_on: string | null;
  region_ar: string;
  region_en: string;
  notes_ar: string;
  notes_en: string;
  certificate: string | null;
  current: number;
  name_ar: string;
  name_en: string;
  visible: number;
}

const SELECT = `SELECT l.*, p.name_ar, p.name_en, p.visible FROM lots l JOIN products p ON p.id = l.product_id`;

const toLot = (r: Row): Lot => ({
  id: r.id,
  code: r.code,
  productId: r.product_id,
  harvestOn: r.harvest_on,
  region: { ar: r.region_ar, en: r.region_en },
  notes: { ar: r.notes_ar, en: r.notes_en },
  certificateUrl: r.certificate ? docUrl(r.certificate) : null,
});

/**
 * A lot looked up by the code on the jar. Old lots stay findable (customers
 * may still have the jar), but only for products that are visible.
 */
export async function getLotByCode(code: string): Promise<Lot | null> {
  "use cache";
  cacheTag(LOTS_TAG);
  cacheLife("minutes");
  const r = db().prepare(`${SELECT} WHERE l.code = ? AND p.visible = 1`).get(code) as Row | undefined;
  return r ? toLot(r) : null;
}

/** Current lots of a product, shown on its page. */
export async function getProductLots(productId: string): Promise<Lot[]> {
  "use cache";
  cacheTag(LOTS_TAG);
  cacheLife("minutes");
  return (
    db()
      .prepare(`${SELECT} WHERE l.product_id = ? AND l.current = 1 ORDER BY l.harvest_on DESC, l.created_at DESC LIMIT 5`)
      .all(productId) as unknown as Row[]
  ).map(toLot);
}

// ---------- Admin ----------

export function listAdminLots(): AdminLot[] {
  return (db().prepare(`${SELECT} ORDER BY l.created_at DESC`).all() as unknown as Row[]).map((r) => ({
    ...toLot(r),
    productName: { ar: r.name_ar, en: r.name_en },
    current: r.current === 1,
    certificate: r.certificate,
  }));
}

export interface LotInput {
  code: string;
  productId: string;
  harvestOn: string | null;
  region: { ar: string; en: string };
  notes: { ar: string; en: string };
  current: boolean;
}

export type SaveLotResult =
  | { ok: true; oldCertificate: string | null }
  | { ok: false; error: "code_taken" | "product" | "not_found" };

/**
 * Create (no id) or update a lot. `certificate`: new file name, null to
 * remove, undefined to keep. Returns the replaced file to delete.
 */
export function saveLot(id: string | null, input: LotInput, certificate: string | null | undefined): SaveLotResult {
  const d = db();
  if (!d.prepare("SELECT 1 FROM products WHERE id = ?").get(input.productId)) return { ok: false, error: "product" };
  const clash = d.prepare("SELECT id FROM lots WHERE code = ?").get(input.code) as { id: string } | undefined;
  if (clash && clash.id !== id) return { ok: false, error: "code_taken" };

  if (!id) {
    d.prepare(
      `INSERT INTO lots (id, code, product_id, harvest_on, region_ar, region_en, notes_ar, notes_en, certificate, current)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      randomUUID(), input.code, input.productId, input.harvestOn, input.region.ar, input.region.en,
      input.notes.ar, input.notes.en, certificate ?? null, input.current ? 1 : 0,
    );
    return { ok: true, oldCertificate: null };
  }
  const row = d.prepare("SELECT certificate FROM lots WHERE id = ?").get(id) as { certificate: string | null } | undefined;
  if (!row) return { ok: false, error: "not_found" };
  d.prepare(
    `UPDATE lots SET code = ?, product_id = ?, harvest_on = ?, region_ar = ?, region_en = ?, notes_ar = ?,
       notes_en = ?, certificate = ?, current = ? WHERE id = ?`,
  ).run(
    input.code, input.productId, input.harvestOn, input.region.ar, input.region.en, input.notes.ar,
    input.notes.en, certificate === undefined ? row.certificate : certificate, input.current ? 1 : 0, id,
  );
  const replaced = certificate !== undefined && row.certificate && row.certificate !== certificate;
  return { ok: true, oldCertificate: replaced ? row.certificate : null };
}

/** Returns the lot's certificate file name to delete, or false if not found. */
export function deleteLot(id: string): string | null | false {
  const row = db().prepare("SELECT certificate FROM lots WHERE id = ?").get(id) as { certificate: string | null } | undefined;
  if (!row) return false;
  db().prepare("DELETE FROM lots WHERE id = ?").run(id);
  return row.certificate;
}
