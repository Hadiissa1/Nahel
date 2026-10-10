import "server-only";
import { randomUUID } from "node:crypto";
import { cacheLife, cacheTag } from "next/cache";
import { Statement, db } from "@/lib/db";
import { ratingSummaries } from "@/lib/reviews";
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
  sale_price: number | null;
  stock: number | null;
}

async function load(where: string, ...params: string[]): Promise<AdminProduct[]> {
  const rows = (await db()
    .prepare(`SELECT * FROM products ${where} ORDER BY sort, created_at`)
    .all(...params)) as unknown as ProductRow[];
  if (rows.length === 0) return [];
  const [variants, ratings] = await Promise.all([
    db()
      .prepare(`SELECT * FROM variants WHERE product_id IN (${rows.map(() => "?").join(",")}) ORDER BY sort`)
      .all(...rows.map((r) => r.id)) as Promise<unknown> as Promise<VariantRow[]>,
    ratingSummaries(),
  ]);
  const byProduct = new Map<string, Variant[]>();
  for (const v of variants) {
    const list = byProduct.get(v.product_id) ?? [];
    const onSale = v.sale_price !== null && v.price !== null && v.sale_price < v.price;
    list.push({
      id: v.id,
      label: v.label,
      price: onSale ? v.sale_price : v.price,
      wasPrice: onSale ? v.price : null,
      stock: v.stock,
    });
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
    rating: ratings.get(r.id) ?? null,
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
  return (await load("WHERE visible = 1"))
    .filter((p) => p.variants.length > 0)
    .map((p) => ({
      id: p.id,
      category: p.category,
      name: p.name,
      origin: p.origin,
      desc: p.desc,
      photo: p.photo,
      variants: p.variants,
      rating: p.rating,
    }));
}

/** Admin reads: always fresh, include hidden products. */
export function listAdminProducts(): Promise<AdminProduct[]> {
  return load("");
}

export async function getAdminProduct(id: string): Promise<AdminProduct | undefined> {
  return (await load("WHERE id = ?", id))[0];
}

export interface ProductInput {
  category: CategoryId;
  name: { ar: string; en: string };
  origin: { ar: string; en: string };
  desc: { ar: string; en: string };
  visible: boolean;
  variants: {
    id?: string;
    label: string;
    price: number | null;
    /** Must be lower than `price`; null = not on sale. */
    salePrice: number | null;
    stock: number | null;
  }[];
}

/** Batch steps writing a product's sizes: reuses known ids, deletes sizes no longer listed. */
async function variantSteps(productId: string, variants: ProductInput["variants"]): Promise<Statement[]> {
  const existing = new Set(
    ((await db().prepare("SELECT id FROM variants WHERE product_id = ?").all(productId)) as { id: string }[]).map(
      (r) => r.id,
    ),
  );
  const kept = new Set<string>();
  const steps = variants.map((v, i) => {
    // Only reuse an id that already belongs to this product.
    const id = v.id && existing.has(v.id) ? v.id : randomUUID();
    kept.add(id);
    return new Statement(
      `INSERT INTO variants (id, product_id, label, price, sale_price, stock, sort) VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET label = excluded.label, price = excluded.price,
         sale_price = excluded.sale_price, stock = excluded.stock, sort = excluded.sort`,
      [id, productId, v.label, v.price, v.salePrice, v.stock, i],
    );
  });
  for (const id of existing) {
    if (!kept.has(id)) steps.push(new Statement("DELETE FROM variants WHERE id = ?", [id]));
  }
  return steps;
}

export async function createProduct(input: ProductInput, photo: string | null): Promise<string> {
  const id = randomUUID();
  await db().batch([
    new Statement(
      `INSERT INTO products (id, category, name_ar, name_en, origin_ar, origin_en, desc_ar, desc_en, photo, visible, sort)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort), 0) + 1 FROM products))`,
      [
        id, input.category, input.name.ar, input.name.en, input.origin.ar, input.origin.en,
        input.desc.ar, input.desc.en, photo, input.visible ? 1 : 0,
      ],
    ),
    ...(await variantSteps(id, input.variants)),
  ]);
  return id;
}

/** Returns the previous photo id when it was replaced/removed (to delete its files). */
export async function updateProduct(
  id: string,
  input: ProductInput,
  photo: string | null | undefined,
): Promise<{ found: boolean; oldPhoto: string | null }> {
  const row = (await db().prepare("SELECT photo FROM products WHERE id = ?").get(id)) as
    | { photo: string | null }
    | undefined;
  if (!row) return { found: false, oldPhoto: null };
  await db().batch([
    new Statement(
      `UPDATE products SET category = ?, name_ar = ?, name_en = ?, origin_ar = ?, origin_en = ?,
         desc_ar = ?, desc_en = ?, visible = ?, photo = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [
        input.category, input.name.ar, input.name.en, input.origin.ar, input.origin.en,
        input.desc.ar, input.desc.en, input.visible ? 1 : 0,
        photo === undefined ? row.photo : photo, id,
      ],
    ),
    ...(await variantSteps(id, input.variants)),
  ]);
  const replaced = photo !== undefined && row.photo && row.photo !== photo;
  return { found: true, oldPhoto: replaced ? row.photo : null };
}

/** Returns the deleted product's photo id (to delete its files). */
export async function deleteProduct(id: string): Promise<{ found: boolean; photo: string | null }> {
  const [found] = await db().batch([
    new Statement("SELECT photo FROM products WHERE id = ?", [id]),
    new Statement("DELETE FROM products WHERE id = ?", [id]),
  ]);
  const row = found.rows[0] as { photo: string | null } | undefined;
  return row ? { found: true, photo: row.photo } : { found: false, photo: null };
}

export async function setVisible(id: string, visible: boolean): Promise<boolean> {
  const r = await db()
    .prepare("UPDATE products SET visible = ?, updated_at = datetime('now') WHERE id = ?")
    .run(visible ? 1 : 0, id);
  return r.changes > 0;
}

export async function setStock(variantId: string, stock: number | null): Promise<boolean> {
  const [r] = await db().batch([
    new Statement("UPDATE variants SET stock = ? WHERE id = ?", [stock, variantId]),
    new Statement(
      "UPDATE products SET updated_at = datetime('now') WHERE id = (SELECT product_id FROM variants WHERE id = ?)",
      [variantId],
    ),
  ]);
  return r.changes > 0;
}

/** One visible product from the cached catalog (undefined if hidden/unknown). */
export async function getProduct(id: string): Promise<CatalogProduct | undefined> {
  return (await getCatalog()).find((p) => p.id === id);
}
