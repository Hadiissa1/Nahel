"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { deleteArticleAction } from "@/app/admin/actions";
import { a } from "@/lib/admin-i18n";
import { pickText } from "@/lib/catalog-types";
import type { AdminArticle } from "@/lib/article-types";

export function ArticleList({ articles, saved }: { articles: AdminArticle[]; saved?: string }) {
  const { lang } = useLang();
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const k = a.articles;

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-bark-deep">{k.title[lang]}</h1>
        <Link href="/admin/articles/new" className="rounded-xl bg-gradient-to-br from-honey to-amber px-4 py-2 text-sm font-semibold text-white shadow">
          + {k.add[lang]}
        </Link>
      </div>
      <p className="rounded-xl bg-honey/10 px-4 py-2.5 text-xs text-bark/70">{k.intro[lang]}</p>
      {saved === "created" || saved === "updated" ? (
        <p role="status" className="rounded-xl bg-leaf/15 px-4 py-2.5 text-sm font-medium text-leaf">{k.created[lang]}</p>
      ) : null}
      {failed && <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{k.failed[lang]}</p>}

      {articles.length === 0 ? (
        <p className="text-sm text-bark/60">{k.empty[lang]}</p>
      ) : (
        <ul className="space-y-3">
          {articles.map((ar) => (
            <li key={ar.id} aria-label={ar.slug} className="flex flex-wrap items-center gap-3 rounded-2xl border border-bark/10 bg-white p-4">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-bark-deep">{pickText(ar.title, lang)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ar.published ? "bg-leaf/15 text-leaf" : "bg-bark/10 text-bark/60"}`}>
                    {ar.published ? k.published[lang] : k.draft[lang]}
                  </span>
                </p>
                <p className="text-xs text-bark/55" dir="ltr">/blog/{ar.slug}{ar.publishedOn ? ` · ${ar.publishedOn}` : ""}</p>
              </div>
              <div className="flex gap-2">
                {ar.published && (
                  <Link href={`/blog/${ar.slug}`} target="_blank" className="rounded-xl border border-bark/15 bg-white px-3 py-1.5 text-sm font-semibold text-bark hover:border-honey">
                    {k.view[lang]}
                  </Link>
                )}
                <Link href={`/admin/articles/${ar.id}`} className="rounded-xl border border-bark/15 bg-white px-3 py-1.5 text-sm font-semibold text-bark hover:border-honey">
                  {k.edit[lang]}
                </Link>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (!confirm(k.confirmDelete[lang])) return;
                    startTransition(async () => {
                      const r = await deleteArticleAction(ar.id);
                      setFailed(!r.ok);
                      router.refresh();
                    });
                  }}
                  className="rounded-xl border border-bark/15 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:border-red-300 disabled:opacity-50"
                >
                  {k.delete[lang]}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
