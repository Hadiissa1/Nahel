import "server-only";
import { randomUUID } from "node:crypto";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import type {
  AdminProduct,
  CatalogProduct,
  CategoryId,
  Variant,
} from "@/lib/catalog-types";

export const PRODUCTS_TAG = "products";

interface ProductRow {
  id: string;
  category: CategoryId;
  name_ar: string;
  name_en: string;
  origin_ar: string;
  origin_en: string;
  desc_ar: string;
  desc_en: string;
  photo: string | null;
  visible: number;
  updated_at: string;
}
interface VariantRow {
  id: string;
  product_id: string;
  label: string;
  price: number | null;
  stock: number | null;
}

function load(where: string, ...params: string[]): AdminProduct[] {
  const rows = db()
    .prepare(`SELECT * FROM products ${where} ORDER BY sort, created_at`)
    .all(...params) as unknown as ProductRow[];
  if (rows.length === 0) return [];
  const variants = db()
    .prepare(
      `SELECT * FROM variants WHERE product_id IN (${rows.map(() => "?").join(",")}) ORDER BY sort`,
    )
    .all(...rows.map((r) => r.id)) as unknown as VariantRow[];
  const byProduct = new Map<string, Variant[]>();
  for (const v of variants) {
    const list = byProduct.get(v.product_id) ?? [];
    list.push({ id: v.id, label: v.label, price: v.price, stock: v.stock });
    byProduct.set(v.product_id, list);
  }
  return rows.map((r) => ({
    id: r.id,
    category: r.category,
    name: { ar: r.name_ar, en: r.name_en },
    origin: { ar: r.origin_ar, en: r.origin_en },
    desc: { ar: r.desc_ar, en: r.desc_en },
    photo: r.photo,
    variants: byProduct.get(r.id) ?? [],
    visible: r.visible === 1,
    updatedAt: r.updated_at,
  }));
}

/**
 * Public catalog. Cached in memory and shared by every visitor; admin changes
 * expire it at once (updateTag), and other server processes pick changes up
 * within a minute.
 */
export async function getCatalog(): Promise<CatalogProduct[]> {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  cacheLife("minutes");
  return load("WHERE visible = 1")
    .filter((p) => p.variants.length > 0)
    .map((p) => ({
      id: p.id,
      category: p.category,
      name: p.name,
      origin: p.origin,
      desc: p.desc,
      photo: p.photo,
      variants: p.variants,
    }));
}

/** Admin reads: always fresh, include hidden products. */
export function listAdminProducts(): AdminProduct[] {
  return load("");
}

export function getAdminProduct(id: string): AdminProduct | undefined {
  return load("WHERE id = ?", id)[0];
}

export interface ProductInput {
  category: CategoryId;
  name: { ar: string; en: string };
  origin: { ar: string; en: string };
  desc: { ar: string; en: string };
  visible: boolean;
  variants: { id?: string; label: string; price: number | null; stock: number | null }[];
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

function writeVariants(productId: string, variants: ProductInput["variants"]) {
  const d = db();
  const existing = new Set(
    (d.prepare("SELECT id FROM variants WHERE product_id = ?").all(productId) as {
      id: string;
    }[]).map((r) => r.id),
  );
  const kept = new Set<string>();
  variants.forEach((v, i) => {
    // Only reuse an id that already belongs to this product.
    const id = v.id && existing.has(v.id) ? v.id : randomUUID();
    kept.add(id);
    d.prepare(
      `INSERT INTO variants (id, product_id, label, price, stock, sort) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET label = excluded.label, price = excluded.price,
         stock = excluded.stock, sort = excluded.sort`,
    ).run(id, productId, v.label, v.price, v.stock, i);
  });
  for (const id of existing) {
    if (!kept.has(id)) d.prepare("DELETE FROM variants WHERE id = ?").run(id);
  }
}

export function createProduct(input: ProductInput, photo: string | null): string {
  const id = randomUUID();
  tx(() => {
    const { m } = db().prepare("SELECT COALESCE(MAX(sort), 0) + 1 AS m FROM products").get() as {
      m: number;
    };
    db()
      .prepare(
        `INSERT INTO products (id, category, name_ar, name_en, origin_ar, origin_en, desc_ar, desc_en, photo, visible, sort)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id, input.category, input.name.ar, input.name.en, input.origin.ar, input.origin.en,
        input.desc.ar, input.desc.en, photo, input.visible ? 1 : 0, m,
      );
    writeVariants(id, input.variants);
  });
  return id;
}

/** Returns the previous photo id when it was replaced/removed (to delete its files). */
export function updateProduct(
  id: string,
  input: ProductInput,
  photo: string | null | undefined,
): { found: boolean; oldPhoto: string | null } {
  return tx(() => {
    const row = db().prepare("SELECT photo FROM products WHERE id = ?").get(id) as
      | { photo: string | null }
      | undefined;
    if (!row) return { found: false, oldPhoto: null };
    db()
      .prepare(
        `UPDATE products SET category = ?, name_ar = ?, name_en = ?, origin_ar = ?, origin_en = ?,
           desc_ar = ?, desc_en = ?, visible = ?, photo = ?, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .run(
        input.category, input.name.ar, input.name.en, input.origin.ar, input.origin.en,
        input.desc.ar, input.desc.en, input.visible ? 1 : 0,
        photo === undefined ? row.photo : photo, id,
      );
    writeVariants(id, input.variants);
    const replaced = photo !== undefined && row.photo && row.photo !== photo;
    return { found: true, oldPhoto: replaced ? row.photo : null };
  });
}

/** Returns the deleted product's photo id (to delete its files). */
export function deleteProduct(id: string): { found: boolean; photo: string | null } {
  return tx(() => {
    const row = db().prepare("SELECT photo FROM products WHERE id = ?").get(id) as
      | { photo: string | null }
      | undefined;
    if (!row) return { found: false, photo: null };
    db().prepare("DELETE FROM products WHERE id = ?").run(id);
    return { found: true, photo: row.photo };
  });
}

export function setVisible(id: string, visible: boolean): boolean {
  const r = db()
    .prepare("UPDATE products SET visible = ?, updated_at = datetime('now') WHERE id = ?")
    .run(visible ? 1 : 0, id);
  return Number(r.changes) > 0;
}

export function setStock(variantId: string, stock: number | null): boolean {
  const r = db().prepare("UPDATE variants SET stock = ? WHERE id = ?").run(stock, variantId);
  if (Number(r.changes) > 0) {
    db()
      .prepare(
        "UPDATE products SET updated_at = datetime('now') WHERE id = (SELECT product_id FROM variants WHERE id = ?)",
      )
      .run(variantId);
  }
  return Number(r.changes) > 0;
}
