"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { login, logout, requireAdmin } from "@/lib/auth";
import { CATEGORIES, type CategoryId } from "@/lib/catalog-types";
import { PhotoError, deletePhoto, savePhoto } from "@/lib/photo-store";
import {
  PRODUCTS_TAG,
  createProduct,
  deleteProduct,
  setStock,
  setVisible,
  updateProduct,
  type ProductInput,
} from "@/lib/products";

// ---------- Auth ----------

export type LoginState = { error?: "invalid" | "blocked" | "not_configured" };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "").slice(0, 200);
  const result = await login(password);
  if (result !== "ok") return { error: result };
  redirect("/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

// ---------- Validation ----------

export type FieldErrors = Partial<Record<string, string>>;
export type SaveState = { errors?: FieldErrors };

const LIMITS = { name: 120, origin: 80, desc: 1000, label: 30, variants: 10 };

const clean = (v: FormDataEntryValue | null) =>
  String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();

function parsePrice(raw: string): number | null | "invalid" {
  if (raw === "") return null;
  if (!/^\d{1,7}([.,]\d{1,2})?$/.test(raw)) return "invalid";
  return Math.round(parseFloat(raw.replace(",", ".")) * 100);
}

function parseStock(raw: string): number | null | "invalid" {
  if (raw === "") return null;
  if (!/^\d{1,7}$/.test(raw)) return "invalid";
  return parseInt(raw, 10);
}

function parseProduct(fd: FormData): { input?: ProductInput; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const text = (key: string, max: number) => {
    const v = clean(fd.get(key));
    if (v.length > max) errors[key] = "too_long";
    return v.slice(0, max);
  };

  const category = clean(fd.get("category")) as CategoryId;
  if (!CATEGORIES.includes(category)) errors.category = "required";

  const name = { ar: text("name_ar", LIMITS.name), en: text("name_en", LIMITS.name) };
  if (!name.ar && !name.en) errors.name_ar = "name_required";
  const origin = { ar: text("origin_ar", LIMITS.origin), en: text("origin_en", LIMITS.origin) };
  const desc = { ar: text("desc_ar", LIMITS.desc), en: text("desc_en", LIMITS.desc) };

  const ids = fd.getAll("variant_id").map(clean);
  const labels = fd.getAll("variant_label").map(clean);
  const prices = fd.getAll("variant_price").map(clean);
  const stocks = fd.getAll("variant_stock").map(clean);
  const count = labels.length;
  if (count === 0) errors.variants = "variants_required";
  if (count > LIMITS.variants) errors.variants = "variants_max";
  if (ids.length !== count || prices.length !== count || stocks.length !== count)
    errors.variants = "invalid";

  const seen = new Set<string>();
  const variants: ProductInput["variants"] = [];
  for (let i = 0; i < Math.min(count, LIMITS.variants); i++) {
    const label = labels[i].slice(0, LIMITS.label);
    if (labels[i].length > LIMITS.label) errors[`variant_label_${i}`] = "too_long";
    if (count > 1 && !label) errors[`variant_label_${i}`] = "label_required";
    if (label && seen.has(label.toLowerCase())) errors[`variant_label_${i}`] = "label_duplicate";
    seen.add(label.toLowerCase());
    const price = parsePrice(prices[i] ?? "");
    if (price === "invalid") errors[`variant_price_${i}`] = "price_invalid";
    const stock = parseStock(stocks[i] ?? "");
    if (stock === "invalid") errors[`variant_stock_${i}`] = "stock_invalid";
    variants.push({
      id: ids[i] || undefined,
      label,
      price: price === "invalid" ? null : price,
      stock: stock === "invalid" ? null : stock,
    });
  }

  if (Object.keys(errors).length) return { errors };
  return {
    errors,
    input: { category, name, origin, desc, visible: fd.get("visible") === "on", variants },
  };
}

// ---------- Products ----------

export async function saveProductAction(_prev: SaveState, fd: FormData): Promise<SaveState> {
  await requireAdmin();
  const { input, errors } = parseProduct(fd);
  if (!input) return { errors };

  const id = clean(fd.get("id"));
  const file = fd.get("photo");
  const removePhoto = fd.get("remove_photo") === "1";

  let newPhoto: string | null = null;
  if (file instanceof File && file.size > 0) {
    try {
      newPhoto = await savePhoto(file);
    } catch (e) {
      return { errors: { photo: e instanceof PhotoError ? `photo_${e.message}` : "photo_unreadable" } };
    }
  }

  try {
    if (id) {
      const photo = newPhoto ?? (removePhoto ? null : undefined);
      const { found, oldPhoto } = updateProduct(id, input, photo);
      if (!found) {
        await deletePhoto(newPhoto);
        return { errors: { form: "not_found" } };
      }
      await deletePhoto(oldPhoto);
    } else {
      createProduct(input, newPhoto);
    }
  } catch {
    await deletePhoto(newPhoto);
    return { errors: { form: "save_failed" } };
  }

  updateTag(PRODUCTS_TAG);
  redirect(`/admin?saved=${id ? "updated" : "created"}`);
}

export async function deleteProductAction(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (typeof id !== "string" || id.length > 100) return { ok: false };
  const { found, photo } = deleteProduct(id);
  if (found) {
    await deletePhoto(photo);
    updateTag(PRODUCTS_TAG);
  }
  return { ok: found };
}

export async function setVisibleAction(id: string, visible: boolean): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (typeof id !== "string" || typeof visible !== "boolean") return { ok: false };
  const ok = setVisible(id, visible);
  if (ok) updateTag(PRODUCTS_TAG);
  return { ok };
}

export async function setStockAction(variantId: string, raw: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (typeof variantId !== "string" || typeof raw !== "string") return { ok: false };
  const stock = parseStock(raw.trim());
  if (stock === "invalid") return { ok: false };
  const ok = setStock(variantId, stock);
  if (ok) updateTag(PRODUCTS_TAG);
  return { ok };
}
