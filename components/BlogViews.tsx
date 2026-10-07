"use client";

import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";
import { useCatalog } from "@/components/CatalogProvider";
import { ArticleCard } from "@/components/ArticleCard";
import { ProductCard } from "@/components/ProductCard";
import { SafeImage } from "@/components/SafeImage";
import { SectionHeading } from "@/components/SectionHeading";
import { t } from "@/lib/translations";
import { photoUrl, pickText } from "@/lib/catalog-types";
import { parseBody, type Article } from "@/lib/article-types";

/** Article text in the simple format (headings, paragraphs, lists); plain text only. */
export function ArticleBody({ text }: { text: string }) {
  return (
    <div className="space-y-4 text-base leading-relaxed text-bark/85">
      {parseBody(text).map((b, i) =>
        b.type === "h2" ? (
          <h2 key={i} className="pt-3 font-display text-xl font-bold text-bark-deep">{b.text}</h2>
        ) : b.type === "ul" ? (
          <ul key={i} className="list-disc space-y-1.5 ps-6 marker:text-amber">
            {b.items.map((it, j) => <li key={j}>{it}</li>)}
          </ul>
        ) : (
          <p key={i}>{b.text}</p>
        ),
      )}
    </div>
  );
}

/** /blog: all published articles. */
export function BlogIndex({ articles }: { articles: Article[] }) {
  const { lang } = useLang();
  return (
    <main className="flex-1 bg-cream pt-28 pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow={t.blog.eyebrow[lang]} title={t.blog.title[lang]} subtitle={t.blog.subtitle[lang]} />
        {articles.length === 0 ? (
          <p className="mt-10 text-center text-bark/60">{t.blog.empty[lang]}</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => <ArticleCard key={a.id} article={a} />)}
          </div>
        )}
      </div>
    </main>
  );
}

/** One article, in the visitor's language (the other one if missing). */
export function ArticleView({ article }: { article: Article }) {
  const { lang } = useLang();
  const { byId } = useCatalog();
  const products = article.products.map((id) => byId.get(id)).filter((p) => p !== undefined);
  // Show the body in the same language as the title, so a page never mixes them.
  const bodyLang = article.title[lang] && article.body[lang] ? lang : lang === "ar" ? "en" : "ar";
  return (
    <main className="flex-1 bg-cream pt-24 pb-20">
      <article className="mx-auto max-w-3xl px-4 sm:px-6" lang={bodyLang} dir={bodyLang === "ar" ? "rtl" : "ltr"}>
        <nav aria-label="Breadcrumb" className="text-sm text-bark/60">
          <Link href="/blog" className="hover:text-amber">← {t.blog.back[lang]}</Link>
        </nav>
        <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-bark-deep sm:text-4xl">
          {article.title[bodyLang] || pickText(article.title, lang)}
        </h1>
        {article.publishedOn && (
          <time dateTime={article.publishedOn} className="mt-2 block text-sm text-bark/50" dir="ltr">
            {article.publishedOn}
          </time>
        )}
        <p className="mt-4 text-lg leading-relaxed text-bark/75">{article.summary[bodyLang] || pickText(article.summary, lang)}</p>
        {article.photo && (
          <SafeImage src={photoUrl(article.photo, "lg")} alt="" className="mt-6 aspect-[16/9] w-full overflow-hidden rounded-3xl" />
        )}
        <div className="mt-8">
          <ArticleBody text={article.body[bodyLang] || pickText(article.body, lang)} />
        </div>
      </article>
      {products.length > 0 && (
        <section className="mx-auto mt-14 max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-bark-deep">{t.blog.related[lang]}</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </main>
  );
}

/** Home page block: the latest three articles. */
export function LatestTips({ articles }: { articles: Article[] }) {
  const { lang } = useLang();
  if (articles.length === 0) return null;
  return (
    <section id="tips" className="scroll-mt-20 bg-cream py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow={t.blog.eyebrow[lang]} title={t.blog.title[lang]} subtitle={t.blog.subtitle[lang]} />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.slice(0, 3).map((a) => <ArticleCard key={a.id} article={a} />)}
        </div>
        <div className="mt-8 text-center">
          <Link href="/blog" className="inline-block rounded-full border border-bark/20 bg-white px-6 py-2.5 text-sm font-semibold text-bark hover:border-honey hover:text-amber">
            {t.blog.all[lang]} →
          </Link>
        </div>
      </div>
    </section>
  );
}
