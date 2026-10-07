import {
  equipmentProducts,
  healthProducts,
  honeyProducts,
  type Product,
} from "@/lib/data";

export type CategoryId = "honey" | "health" | "equipment";

export const CATEGORIES: CategoryId[] = ["honey", "health", "equipment"];

/** Weight options offered for every honey (standard for honey shops). */
export const HONEY_WEIGHTS = ["250g", "500g", "1kg"] as const;

export interface CatalogEntry {
  product: Product;
  category: CategoryId;
  variants?: readonly string[];
}

export const CATALOG: CatalogEntry[] = [
  ...honeyProducts.map((product) => ({
    product,
    category: "honey" as const,
    variants: HONEY_WEIGHTS,
  })),
  ...healthProducts.map((product) => ({ product, category: "health" as const })),
  ...equipmentProducts.map((product) => ({
    product,
    category: "equipment" as const,
  })),
];

const BY_ID = new Map(CATALOG.map((e) => [e.product.id, e]));

export function findEntry(id: string): CatalogEntry | undefined {
  return BY_ID.get(id);
}
