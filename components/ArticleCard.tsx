"use client";

import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";
import { SafeImage } from "@/components/SafeImage";
import { t } from "@/lib/translations";
import { photoUrl, pickText } from "@/lib/catalog-types";
import type { Article } from "@/lib/article-types";

export function ArticleCard({ article }: { article: Article }) {
  const { lang } = useLang();
  const href = `/blog/${article.slug}`;
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-bark/10 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
      <Link href={href} className="relative block h-40 overflow-hidden" tabIndex={-1} aria-hidden="true">
        {article.photo ? (
          <SafeImage src={photoUrl(article.photo, "sm")} alt="" icon="HoneyJar" className="h-full w-full" imgClassName="transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-honey-light via-honey to-amber text-5xl">🍯</div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-5">
        {article.publishedOn && (
          <time dateTime={article.publishedOn} className="text-xs text-bark/50" dir="ltr">
            {article.publishedOn}
          </time>
        )}
        <h3 className="font-display text-lg font-semibold leading-snug text-bark-deep">
          <Link href={href} className="hover:text-amber">
            {pickText(article.title, lang)}
          </Link>
        </h3>
        <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-bark/70">{pickText(article.summary, lang)}</p>
        <Link href={href} className="text-sm font-semibold text-amber hover:text-bark">
          {t.blog.read[lang]} →
        </Link>
      </div>
    </article>
  );
}
