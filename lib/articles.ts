import "server-only";
import { randomUUID } from "node:crypto";
import { cacheLife, cacheTag } from "next/cache";
import { Statement, db } from "@/lib/db";
import type { AdminArticle, Article } from "@/lib/article-types";

export const ARTICLES_TAG = "articles";

interface Row {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  summary_ar: string;
  summary_en: string;
  body_ar: string;
  body_en: string;
  photo: string | null;
  products: string;
  published: number;
  published_on: string | null;
  updated_at: string;
}

const toAdmin = (r: Row): AdminArticle => ({
  id: r.id,
  slug: r.slug,
  title: { ar: r.title_ar, en: r.title_en },
  summary: { ar: r.summary_ar, en: r.summary_en },
  body: { ar: r.body_ar, en: r.body_en },
  photo: r.photo,
  products: r.products ? r.products.split(",") : [],
  publishedOn: r.published_on,
  published: r.published === 1,
  updatedAt: r.updated_at,
});

const toPublic = (r: Row): Article => {
  const a = toAdmin(r);
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    summary: a.summary,
    body: a.body,
    photo: a.photo,
    products: a.products,
    publishedOn: a.publishedOn,
  };
};

/** Published articles, newest first (cached; admin changes expire it). */
export async function getPublishedArticles(): Promise<Article[]> {
  "use cache";
  cacheTag(ARTICLES_TAG);
  cacheLife("minutes");
  return (
    (await db()
      .prepare("SELECT * FROM articles WHERE published = 1 ORDER BY published_on DESC, created_at DESC")
      .all()) as unknown as Row[]
  ).map(toPublic);
}

/**
 * One published article. Cached per address (not taken from the list above):
 * a new article must show on its very first visit, and pages for addresses
 * unknown at build time could otherwise reuse the list as it was then.
 */
export async function getArticle(slug: string): Promise<Article | undefined> {
  "use cache";
  cacheTag(ARTICLES_TAG);
  cacheLife("minutes");
  const r = (await db().prepare("SELECT * FROM articles WHERE slug = ? AND published = 1").get(slug)) as Row | undefined;
  return r ? toPublic(r) : undefined;
}

// ---------- Admin ----------

export async function listAdminArticles(): Promise<AdminArticle[]> {
  return ((await db().prepare("SELECT * FROM articles ORDER BY created_at DESC").all()) as unknown as Row[]).map(toAdmin);
}

export async function getAdminArticle(id: string): Promise<AdminArticle | undefined> {
  const r = (await db().prepare("SELECT * FROM articles WHERE id = ?").get(id)) as Row | undefined;
  return r && toAdmin(r);
}

export interface ArticleInput {
  slug: string;
  title: { ar: string; en: string };
  summary: { ar: string; en: string };
  body: { ar: string; en: string };
  products: string[];
  published: boolean;
}

export type SaveArticleResult =
  | { ok: true; id: string; oldPhoto: string | null }
  | { ok: false; error: "slug_taken" | "not_found" };

/** photo: new id, null to remove, undefined to keep. */
export async function saveArticle(
  id: string | null,
  a: ArticleInput,
  photo: string | null | undefined,
): Promise<SaveArticleResult> {
  const d = db();
  const clash = (await d.prepare("SELECT id FROM articles WHERE slug = ?").get(a.slug)) as { id: string } | undefined;
  if (clash && clash.id !== id) return { ok: false, error: "slug_taken" };
  // Only products that exist are kept.
  const known = new Set(((await d.prepare("SELECT id FROM products").all()) as { id: string }[]).map((r) => r.id));
  const products = a.products.filter((p) => known.has(p)).join(",");

  if (!id) {
    const newId = randomUUID();
    await d.prepare(
      `INSERT INTO articles (id, slug, title_ar, title_en, summary_ar, summary_en, body_ar, body_en, photo, products, published, published_on)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 1 THEN date('now') END)`,
    ).run(
      newId, a.slug, a.title.ar, a.title.en, a.summary.ar, a.summary.en, a.body.ar, a.body.en,
      photo ?? null, products, a.published ? 1 : 0, a.published ? 1 : 0,
    );
    return { ok: true, id: newId, oldPhoto: null };
  }
  const row = (await d.prepare("SELECT photo FROM articles WHERE id = ?").get(id)) as { photo: string | null } | undefined;
  if (!row) return { ok: false, error: "not_found" };
  await d.prepare(
    `UPDATE articles SET slug = ?, title_ar = ?, title_en = ?, summary_ar = ?, summary_en = ?, body_ar = ?, body_en = ?,
       photo = ?, products = ?, published = ?,
       -- The publication date is set the first time an article is published.
       published_on = CASE WHEN ? = 1 THEN COALESCE(published_on, date('now')) ELSE published_on END,
       updated_at = datetime('now')
     WHERE id = ?`,
  ).run(
    a.slug, a.title.ar, a.title.en, a.summary.ar, a.summary.en, a.body.ar, a.body.en,
    photo === undefined ? row.photo : photo, products, a.published ? 1 : 0, a.published ? 1 : 0, id,
  );
  const replaced = photo !== undefined && row.photo && row.photo !== photo;
  return { ok: true, id, oldPhoto: replaced ? row.photo : null };
}

/** Returns the article's photo id to delete, or false if not found. */
export async function deleteArticle(id: string): Promise<string | null | false> {
  const [found] = await db().batch([
    new Statement("SELECT photo FROM articles WHERE id = ?", [id]),
    new Statement("DELETE FROM articles WHERE id = ?", [id]),
  ]);
  const row = found.rows[0] as { photo: string | null } | undefined;
  return row ? row.photo : false;
}
