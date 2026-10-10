import { randomUUID } from "node:crypto";
import type { CategoryId } from "@/lib/catalog-types";
import { db } from "@/lib/db";
import { listAdminZones, saveZone } from "@/lib/delivery";
import { createProduct, getAdminProduct, type ProductInput } from "@/lib/products";
import { createPromoCode, type PromoInput } from "@/lib/promo";

// Test data built through the app's own functions. Tests never rely on the
// starter catalog (lib/data.ts), which can change at any time.

export interface VariantSpec {
  label?: string;
  /** Cents; null = price on request. */
  price?: number | null;
  salePrice?: number | null;
  /** null = stock not tracked. */
  stock?: number | null;
}

export async function makeProduct(
  opts: { name?: string; category?: CategoryId; visible?: boolean; variants?: VariantSpec[] } = {},
) {
  const name = opts.name ?? `Test honey ${randomUUID().slice(0, 6)}`;
  const input: ProductInput = {
    category: opts.category ?? "honey",
    name: { en: name, ar: `عسل ${name}` },
    origin: { en: "Lebanon", ar: "لبنان" },
    desc: { en: "", ar: "" },
    visible: opts.visible ?? true,
    variants: (opts.variants ?? [{}]).map((v) => ({
      label: v.label ?? "500g",
      price: v.price === undefined ? 2000 : v.price,
      salePrice: v.salePrice ?? null,
      stock: v.stock === undefined ? 10 : v.stock,
    })),
  };
  const id = await createProduct(input, null);
  const product = (await getAdminProduct(id))!;
  return { id, name, product, variantIds: product.variants.map((v) => v.id) };
}

/** Current stock of a size, read straight from the database. */
export async function stockOf(variantId: string): Promise<number | null> {
  const row = await db().prepare("SELECT stock FROM variants WHERE id = ?").get(variantId) as { stock: number | null };
  return row.stock;
}

export async function makeZone(opts: { fee?: number | null; freeFrom?: number | null; active?: boolean } = {}) {
  const en = `Zone ${randomUUID().slice(0, 6)}`;
  await saveZone(null, {
    name: { en, ar: en },
    fee: opts.fee === undefined ? 300 : opts.fee,
    freeFrom: opts.freeFrom ?? null,
    active: opts.active ?? true,
  });
  return (await listAdminZones()).find((z) => z.name.en === en)!;
}

/** Removes the starter delivery zones, so checkout no longer needs a zone. */
export async function clearZones() {
  await db().prepare("DELETE FROM delivery_zones").run();
}

export async function makePromo(opts: Partial<PromoInput> = {}) {
  const input: PromoInput = {
    code: opts.code ?? `T${randomUUID().slice(0, 8).toUpperCase()}`,
    kind: opts.kind ?? "percent",
    value: opts.value ?? 10,
    minTotal: opts.minTotal ?? null,
    expiresOn: opts.expiresOn ?? null,
    maxUses: opts.maxUses ?? null,
  };
  await createPromoCode(input);
  return input;
}

/** Sets how many confirmed orders already used a code. */
export async function setPromoUses(code: string, uses: number) {
  await db().prepare("UPDATE promo_codes SET uses = ? WHERE code = ?").run(uses, code);
}
