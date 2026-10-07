import type { LocalizedText } from "@/lib/data";

export type CategoryId = "honey" | "health" | "equipment";
export const CATEGORIES: CategoryId[] = ["honey", "health", "equipment"];

export interface Variant {
  id: string;
  /** e.g. "500g"; empty when the product has a single option. */
  label: string;
  /** Price in cents; null = "price on request". */
  price: number | null;
  /** Units in stock; null = stock not tracked. */
  stock: number | null;
}

/** A product as the storefront and the cart see it (serializable). */
export interface CatalogProduct {
  id: string;
  category: CategoryId;
  name: LocalizedText;
  origin: LocalizedText;
  desc: LocalizedText;
  /** Photo id (see photoUrl); null = no photo yet. */
  photo: string | null;
  variants: Variant[];
}

/** A product as the admin sees it: includes hidden products. */
export interface AdminProduct extends CatalogProduct {
  visible: boolean;
  updatedAt: string;
}

export const LOW_STOCK = 5;
export const MAX_CART_QTY = 99;

export function photoUrl(photo: string, size: "sm" | "lg") {
  return `/media/${photo}-${size === "sm" ? 800 : 1600}.webp`;
}

export function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function isOutOfStock(v: Variant) {
  return v.stock !== null && v.stock <= 0;
}

/** Name in the requested language, falling back to the other one. */
export function pickText(text: LocalizedText, lang: "en" | "ar") {
  return text[lang] || text[lang === "en" ? "ar" : "en"];
}
