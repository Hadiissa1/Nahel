"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { deleteAlert, sendRestockEmails } from "@/lib/stock-alerts";
import { checkLowStock, saveStockSettings } from "@/lib/low-stock";
import { EXPENSE_CATEGORIES, addExpense, deleteExpense, type ExpenseCategory } from "@/lib/finance";
import { REVIEWS_TAG, deleteReview, setReviewApproved } from "@/lib/reviews";
import { LOTS_TAG, deleteLot, saveLot } from "@/lib/lots";
import { ARTICLES_TAG, deleteArticle, saveArticle } from "@/lib/articles";
import { ARTICLE_LIMITS, SLUG_RE, slugify } from "@/lib/article-types";
import { normalizeLotCode } from "@/lib/lot-types";
import { DocError, deleteDoc, saveDoc } from "@/lib/doc-store";
import { MIN_STAFF_PASSWORD_LENGTH, login, logout, requireAdmin, requireStaff } from "@/lib/auth";
import { USERNAME_RE, createStaff, deleteStaff, setStaffActive, setStaffPassword } from "@/lib/staff";
import { CATEGORIES, type CategoryId } from "@/lib/catalog-types";
import { PhotoError, deletePhoto, savePhoto } from "@/lib/photo-store";
import { mailConfigured } from "@/lib/mail";
import {
  PAYMENTS,
  recordCounterSale,
  type CounterResult,
  type Payment,
  ORDER_STATUSES,
  deleteOrder,
  setOrderStatus,
  type OrderStatus,
  type StatusResult,
} from "@/lib/orders";
import {
  deleteSubscriber,
  normalizeEmail,
  resendConfirmations,
  sendCampaign,
  sendTestCampaign,
} from "@/lib/subscribers";
import { ZONES_TAG, deleteZone, saveZone } from "@/lib/delivery";
import { createPromoCode, deletePromoCode, setPromoActive, shopToday } from "@/lib/promo";
import { MAX_PERCENT, normalizeCode } from "@/lib/promo-types";
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
  const username = String(formData.get("username") ?? "").trim().slice(0, 60);
  const password = String(formData.get("password") ?? "").slice(0, 200);
  const result = await login(username, password);
  if (result !== "ok") return { error: result };
  // Staff start on the orders page (their main job).
  redirect(username ? "/admin/orders" : "/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

/**
 * After a stock change, once the response is sent: email customers waiting
 * for sizes back in stock, and the owner about sizes running low.
 */
function notifyRestocks() {
  after(async () => {
    try {
      await sendRestockEmails();
    } catch (e) {
      console.error("restock emails failed", e);
    }
    try {
      await checkLowStock();
    } catch (e) {
      console.error("low-stock check failed", e);
    }
  });
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
  const sales = fd.getAll("variant_sale").map(clean);
  const count = labels.length;
  if (count === 0) errors.variants = "variants_required";
  if (count > LIMITS.variants) errors.variants = "variants_max";
  if (ids.length !== count || prices.length !== count || stocks.length !== count || sales.length !== count)
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
    const sale = parsePrice(sales[i] ?? "");
    if (sale === "invalid") errors[`variant_sale_${i}`] = "price_invalid";
    else if (sale !== null && (price === null || price === "invalid"))
      errors[`variant_sale_${i}`] = "sale_needs_price";
    else if (sale !== null && typeof price === "number" && sale >= price)
      errors[`variant_sale_${i}`] = "sale_not_lower";
    variants.push({
      id: ids[i] || undefined,
      label,
      price: price === "invalid" ? null : price,
      salePrice: typeof sale === "number" ? sale : null,
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
  notifyRestocks();
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
  if (ok) {
    updateTag(PRODUCTS_TAG);
    if (visible) notifyRestocks();
  }
  return { ok };
}

export async function setStockAction(variantId: string, raw: string): Promise<{ ok: boolean }> {
  await requireStaff(); // staff may update stock
  if (typeof variantId !== "string" || typeof raw !== "string") return { ok: false };
  const stock = parseStock(raw.trim());
  if (stock === "invalid") return { ok: false };
  const ok = setStock(variantId, stock);
  if (ok) {
    updateTag(PRODUCTS_TAG);
    notifyRestocks();
  }
  return { ok };
}

// ---------- Subscribers & promotions ----------

export async function deleteSubscriberAction(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (typeof id !== "string" || id.length > 100) return { ok: false };
  return { ok: deleteSubscriber(id) };
}

export async function resendConfirmationsAction(): Promise<{ sent: number; failed: number } | null> {
  await requireAdmin();
  if (!mailConfigured()) return null;
  return resendConfirmations();
}

export type PromoState = {
  errors?: FieldErrors;
  result?: { sent: number; failed: number };
  test?: "sent" | "failed";
};

export async function sendPromotionAction(_prev: PromoState, fd: FormData): Promise<PromoState> {
  await requireAdmin();
  const errors: FieldErrors = {};
  const text = (key: string, max: number) => {
    const v = clean(fd.get(key));
    if (v.length > max) errors[key] = "too_long";
    return v.slice(0, max);
  };
  const subject = { ar: text("subject_ar", 150), en: text("subject_en", 150) };
  // Keep line breaks in the message body.
  const multiline = (key: string) =>
    String(fd.get(key) ?? "")
      .replace(/\r\n/g, "\n")
      .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "")
      .trim()
      .slice(0, 5000);
  const body = { ar: multiline("body_ar"), en: multiline("body_en") };
  if (!subject.ar && !subject.en) errors.subject_ar = "subject_required";
  if (!body.ar && !body.en) errors.body_ar = "body_required";
  if (!mailConfigured()) errors.form = "mail_not_configured";

  const mode = fd.get("mode") === "test" ? "test" : "all";
  let testTo: string | null = null;
  if (mode === "test") {
    const e = normalizeEmail(String(fd.get("test_email") ?? "").slice(0, 300));
    if (!e || e === "invalid") errors.test_email = "email_invalid";
    else testTo = e;
  }
  if (Object.keys(errors).length) return { errors };

  if (mode === "test") {
    const lang = fd.get("test_lang") === "en" ? "en" : "ar";
    const ok = await sendTestCampaign({ subject, body }, testTo!, lang);
    return { test: ok ? "sent" : "failed" };
  }
  const result = await sendCampaign({ subject, body });
  refresh(); // show the new entry in "Sent promotions"
  return { result };
}

// ---------- Orders ----------

export async function setOrderStatusAction(
  id: number,
  status: OrderStatus,
): Promise<StatusResult> {
  const me = await requireStaff(); // staff handle orders
  if (!Number.isInteger(id) || !ORDER_STATUSES.includes(status)) {
    return { ok: false, error: "transition" };
  }
  const r = setOrderStatus(id, status, me.role === "owner" ? null : me.name);
  if (r.ok && r.stockChanged) {
    updateTag(PRODUCTS_TAG);
    notifyRestocks(); // a cancellation can put stock back
  }
  return r;
}

export async function deleteOrderAction(id: number): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (!Number.isInteger(id)) return { ok: false };
  return { ok: deleteOrder(id) };
}

// ---------- Promo codes ----------

export type CodeState = { errors?: FieldErrors; created?: string };

export async function createPromoCodeAction(_prev: CodeState, fd: FormData): Promise<CodeState> {
  await requireAdmin();
  const errors: FieldErrors = {};
  const code = normalizeCode(clean(fd.get("code")));
  if (!code) errors.code = "code_invalid";

  const kind = fd.get("kind") === "amount" ? "amount" : "percent";
  const rawValue = clean(fd.get("value"));
  let value = 0;
  if (kind === "percent") {
    value = /^\d{1,2}$/.test(rawValue) ? parseInt(rawValue, 10) : 0;
    if (value < 1 || value > MAX_PERCENT) errors.value = "percent_invalid";
  } else {
    const p = parsePrice(rawValue);
    if (typeof p !== "number" || p <= 0) errors.value = "amount_invalid";
    else value = p;
  }

  const minTotal = parsePrice(clean(fd.get("min_total")));
  if (minTotal === "invalid") errors.min_total = "amount_invalid";

  const expiresOn = clean(fd.get("expires_on")) || null;
  if (expiresOn && (!/^\d{4}-\d{2}-\d{2}$/.test(expiresOn) || expiresOn < shopToday()))
    errors.expires_on = "date_invalid";

  const rawUses = clean(fd.get("max_uses"));
  const maxUses = rawUses === "" ? null : /^\d{1,6}$/.test(rawUses) ? parseInt(rawUses, 10) : 0;
  if (maxUses !== null && maxUses < 1) errors.max_uses = "uses_invalid";

  if (Object.keys(errors).length) return { errors };
  const r = createPromoCode({
    code: code!,
    kind,
    value,
    minTotal: minTotal === "invalid" ? null : minTotal,
    expiresOn,
    maxUses,
  });
  if (r === "taken") return { errors: { code: "code_taken" } };
  refresh();
  return { created: code! };
}

export async function setPromoActiveAction(code: string, active: boolean): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (typeof code !== "string" || typeof active !== "boolean" || code.length > 40) return { ok: false };
  return { ok: setPromoActive(code, active) };
}

export async function deletePromoCodeAction(code: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (typeof code !== "string" || code.length > 40) return { ok: false };
  return { ok: deletePromoCode(code) };
}

// ---------- Delivery zones ----------

export type ZoneState = { errors?: FieldErrors; saved?: number };

export async function saveZoneAction(prev: ZoneState, fd: FormData): Promise<ZoneState> {
  await requireAdmin();
  const errors: FieldErrors = {};
  const name = { ar: clean(fd.get("name_ar")).slice(0, 61), en: clean(fd.get("name_en")).slice(0, 61) };
  if (!name.ar && !name.en) errors.name_ar = "zone_name_required";
  if (name.ar.length > 60) errors.name_ar = "too_long";
  if (name.en.length > 60) errors.name_en = "too_long";
  const fee = parsePrice(clean(fd.get("fee")));
  if (fee === "invalid") errors.fee = "price_invalid";
  const freeFrom = parsePrice(clean(fd.get("free_from")));
  if (freeFrom === "invalid") errors.free_from = "price_invalid";
  if (Object.keys(errors).length) return { errors };

  const id = clean(fd.get("id")).slice(0, 100) || null;
  const ok = saveZone(id, {
    name,
    fee: fee as number | null,
    freeFrom: freeFrom as number | null,
    active: fd.get("active") === "on",
  });
  if (!ok) return { errors: { form: "not_found" } };
  updateTag(ZONES_TAG);
  refresh();
  return { saved: (prev.saved ?? 0) + 1 };
}

export async function deleteZoneAction(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (typeof id !== "string" || id.length > 100) return { ok: false };
  const ok = deleteZone(id);
  if (ok) updateTag(ZONES_TAG);
  return { ok };
}

// ---------- Stock alerts ----------

export async function deleteAlertAction(id: string): Promise<{ ok: boolean }> {
  await requireStaff(); // staff send the WhatsApp alerts
  if (typeof id !== "string" || id.length > 100) return { ok: false };
  return { ok: deleteAlert(id) };
}

// ---------- Reviews ----------

export async function setReviewApprovedAction(id: string, approved: boolean): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (typeof id !== "string" || id.length > 100 || typeof approved !== "boolean") return { ok: false };
  const ok = setReviewApproved(id, approved);
  if (ok) {
    updateTag(REVIEWS_TAG);
    updateTag(PRODUCTS_TAG); // ratings are part of the catalog
  }
  return { ok };
}

export async function deleteReviewAction(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (typeof id !== "string" || id.length > 100) return { ok: false };
  const ok = deleteReview(id);
  if (ok) {
    updateTag(REVIEWS_TAG);
    updateTag(PRODUCTS_TAG);
  }
  return { ok };
}

// ---------- Lots (traceability) ----------

export type LotState = { errors?: FieldErrors; saved?: number };

export async function saveLotAction(prev: LotState, fd: FormData): Promise<LotState> {
  await requireAdmin();
  const errors: FieldErrors = {};
  const code = normalizeLotCode(clean(fd.get("code")));
  if (!code) errors.code = "lot_code_invalid";
  const productId = clean(fd.get("product")).slice(0, 100);
  if (!productId) errors.product = "required";
  const harvestOn = clean(fd.get("harvest_on")) || null;
  if (harvestOn && !/^\d{4}-\d{2}-\d{2}$/.test(harvestOn)) errors.harvest_on = "invalid";
  const text = (key: string, max: number) => {
    const v = String(fd.get(key) ?? "").replace(/\r\n/g, "\n").replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "").trim();
    if (v.length > max) errors[key] = "too_long";
    return v.slice(0, max);
  };
  const region = { ar: text("region_ar", 120), en: text("region_en", 120) };
  const notes = { ar: text("notes_ar", 1000), en: text("notes_en", 1000) };
  if (Object.keys(errors).length) return { errors };

  const file = fd.get("certificate");
  let newDoc: string | null = null;
  if (file instanceof File && file.size > 0) {
    try {
      newDoc = await saveDoc(file);
    } catch (e) {
      return { errors: { certificate: e instanceof DocError ? `doc_${e.message}` : "doc_format" } };
    }
  }
  const remove = fd.get("remove_certificate") === "1";
  const id = clean(fd.get("id")).slice(0, 100) || null;
  const r = saveLot(
    id,
    { code: code!, productId, harvestOn, region, notes, current: fd.get("current") === "on" },
    newDoc ?? (remove ? null : undefined),
  );
  if (!r.ok) {
    await deleteDoc(newDoc);
    return { errors: r.error === "code_taken" ? { code: "lot_code_taken" } : { form: r.error } };
  }
  await deleteDoc(r.oldCertificate);
  updateTag(LOTS_TAG);
  // Product pages show their lots: refresh them too (seen otherwise to keep
  // serving the page from before the change for a few requests).
  updateTag(PRODUCTS_TAG);
  refresh();
  return { saved: (prev.saved ?? 0) + 1 };
}

export async function deleteLotAction(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (typeof id !== "string" || id.length > 100) return { ok: false };
  const doc = deleteLot(id);
  if (doc === false) return { ok: false };
  await deleteDoc(doc);
  updateTag(LOTS_TAG);
  updateTag(PRODUCTS_TAG);
  return { ok: true };
}

// ---------- Articles (tips) ----------

export async function saveArticleAction(_prev: SaveState, fd: FormData): Promise<SaveState> {
  await requireAdmin();
  const errors: FieldErrors = {};
  const text = (key: string, max: number, multiline = false) => {
    let v = String(fd.get(key) ?? "").replace(/\r\n/g, "\n");
    v = multiline ? v.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "") : v.replace(/[\u0000-\u001F\u007F]/g, " ");
    v = v.trim();
    if (v.length > max) errors[key] = "too_long";
    return v.slice(0, max);
  };
  const title = { ar: text("title_ar", ARTICLE_LIMITS.title), en: text("title_en", ARTICLE_LIMITS.title) };
  const summary = { ar: text("summary_ar", ARTICLE_LIMITS.summary), en: text("summary_en", ARTICLE_LIMITS.summary) };
  const body = { ar: text("body_ar", ARTICLE_LIMITS.body, true), en: text("body_en", ARTICLE_LIMITS.body, true) };
  if (!title.ar && !title.en) errors.title_ar = "title_required";
  if (!body.ar && !body.en) errors.body_ar = "body_required";
  // Slug: as typed, or made from the English title.
  const slug = slugify(clean(fd.get("slug")) || title.en) || `tip-${Date.now().toString(36)}`;
  if (!SLUG_RE.test(slug) || slug.length > ARTICLE_LIMITS.slug) errors.slug = "slug_invalid";
  const products = fd.getAll("products").map((v) => clean(v).slice(0, 100)).filter(Boolean).slice(0, ARTICLE_LIMITS.products);
  if (Object.keys(errors).length) return { errors };

  const file = fd.get("photo");
  let newPhoto: string | null = null;
  if (file instanceof File && file.size > 0) {
    try {
      newPhoto = await savePhoto(file);
    } catch (e) {
      return { errors: { photo: e instanceof PhotoError ? `photo_${e.message}` : "photo_unreadable" } };
    }
  }
  const id = clean(fd.get("id")).slice(0, 100) || null;
  const r = saveArticle(
    id,
    { slug, title, summary, body, products, published: fd.get("published") === "on" },
    newPhoto ?? (fd.get("remove_photo") === "1" ? null : undefined),
  );
  if (!r.ok) {
    await deletePhoto(newPhoto);
    return { errors: r.error === "slug_taken" ? { slug: "slug_taken" } : { form: "not_found" } };
  }
  await deletePhoto(r.oldPhoto);
  updateTag(ARTICLES_TAG);
  redirect(`/admin/articles?saved=${id ? "updated" : "created"}`);
}

export async function deleteArticleAction(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (typeof id !== "string" || id.length > 100) return { ok: false };
  const photo = deleteArticle(id);
  if (photo === false) return { ok: false };
  await deletePhoto(photo);
  updateTag(ARTICLES_TAG);
  return { ok: true };
}

// ---------- Low-stock alert settings ----------

export type StockSettingsState = { errors?: FieldErrors; saved?: number };

export async function saveStockSettingsAction(prev: StockSettingsState, fd: FormData): Promise<StockSettingsState> {
  await requireAdmin();
  const errors: FieldErrors = {};
  const raw = clean(fd.get("threshold"));
  const threshold = /^\d{1,4}$/.test(raw) ? parseInt(raw, 10) : -1;
  if (threshold < 0) errors.threshold = "stock_invalid";
  const rawEmail = clean(fd.get("email")).slice(0, 300);
  const email = rawEmail ? normalizeEmail(rawEmail) : null;
  if (email === "invalid") errors.email = "email_invalid";
  if (Object.keys(errors).length) return { errors };
  saveStockSettings({ threshold, email: email as string | null });
  notifyRestocks(); // a new threshold or address may need an alert now
  refresh();
  return { saved: (prev.saved ?? 0) + 1 };
}

// ---------- Team (staff accounts) — owner only ----------

export type StaffState = { errors?: FieldErrors; created?: string };

export async function createStaffAction(_prev: StaffState, fd: FormData): Promise<StaffState> {
  await requireAdmin();
  const errors: FieldErrors = {};
  const name = clean(fd.get("name")).slice(0, 61);
  if (!name) errors.name = "required";
  else if (name.length > 60) errors.name = "too_long";
  const username = clean(fd.get("username")).toLowerCase().slice(0, 40);
  if (!USERNAME_RE.test(username)) errors.username = "username_invalid";
  const password = String(fd.get("password") ?? "");
  if (password.length < MIN_STAFF_PASSWORD_LENGTH || password.length > 200) errors.password = "password_short";
  if (Object.keys(errors).length) return { errors };
  if (createStaff({ username, name, password }) === "taken") return { errors: { username: "username_taken" } };
  refresh();
  return { created: username };
}

export async function setStaffActiveAction(id: string, active: boolean): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (typeof id !== "string" || id.length > 100 || typeof active !== "boolean") return { ok: false };
  return { ok: setStaffActive(id, active) };
}

export async function setStaffPasswordAction(id: string, password: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  if (typeof id !== "string" || id.length > 100 || typeof password !== "string") return { ok: false };
  if (password.length < MIN_STAFF_PASSWORD_LENGTH || password.length > 200) return { ok: false, error: "password_short" };
  return { ok: setStaffPassword(id, password) };
}

export async function deleteStaffAction(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (typeof id !== "string" || id.length > 100) return { ok: false };
  return { ok: deleteStaff(id) };
}

// ---------- Till (counter sales) — owner and staff ----------

export async function counterSaleAction(input: {
  lines: { id: string; variant: string; qty: number }[];
  discount: { kind: "percent" | "amount"; value: string } | null;
  payment: string;
  customer: string;
}): Promise<CounterResult> {
  const me = await requireStaff(); // staff run the till
  if (!input || !Array.isArray(input.lines) || input.lines.length === 0 || input.lines.length > 50) return { ok: false, error: "empty" };
  const lines: { id: string; variant: string; qty: number }[] = [];
  for (const l of input.lines) {
    if (!l || typeof l.id !== "string" || typeof l.variant !== "string" || l.id.length > 100 || l.variant.length > 100) return { ok: false, error: "empty" };
    if (!Number.isInteger(l.qty) || l.qty < 1 || l.qty > 9999) return { ok: false, error: "empty" };
    lines.push({ id: l.id, variant: l.variant, qty: l.qty });
  }
  if (!PAYMENTS.includes(input.payment as Payment)) return { ok: false, error: "empty" };
  let discount: { kind: "percent" | "amount"; value: number } | null = null;
  if (input.discount && String(input.discount.value ?? "").trim()) {
    const raw = String(input.discount.value).trim();
    if (input.discount.kind === "percent") {
      if (!/^\d{1,3}$/.test(raw)) return { ok: false, error: "discount" };
      discount = { kind: "percent", value: parseInt(raw, 10) };
    } else {
      const v = parsePrice(raw);
      if (typeof v !== "number") return { ok: false, error: "discount" };
      discount = { kind: "amount", value: v };
    }
  }
  const r = recordCounterSale({
    lines,
    discount,
    payment: input.payment as Payment,
    customer: clean(String(input.customer ?? "")).slice(0, 80),
    by: me.role === "owner" ? null : me.name,
  });
  if (r.ok) {
    updateTag(PRODUCTS_TAG); // stock changed
    notifyRestocks(); // low-stock check
  }
  return r;
}

// ---------- Expenses — owner only ----------

export type ExpenseState = { errors?: FieldErrors; saved?: number };

export async function addExpenseAction(prev: ExpenseState, fd: FormData): Promise<ExpenseState> {
  await requireAdmin();
  const errors: FieldErrors = {};
  const day = clean(fd.get("day"));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) errors.day = "date_invalid";
  const label = clean(fd.get("label")).slice(0, 121);
  if (!label) errors.label = "required";
  else if (label.length > 120) errors.label = "too_long";
  const category = clean(fd.get("category")) as ExpenseCategory;
  if (!EXPENSE_CATEGORIES.includes(category)) errors.category = "required";
  const amount = parsePrice(clean(fd.get("amount")));
  if (typeof amount !== "number" || amount <= 0) errors.amount = "amount_invalid";
  if (Object.keys(errors).length) return { errors };
  addExpense({ day, label, category, amount: amount as number });
  refresh();
  return { saved: (prev.saved ?? 0) + 1 };
}

export async function deleteExpenseAction(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (typeof id !== "string" || id.length > 100) return { ok: false };
  return { ok: deleteExpense(id) };
}
