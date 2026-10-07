"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { Stars } from "@/components/Stars";
import { deleteReviewAction, setReviewApprovedAction } from "@/app/admin/actions";
import { a } from "@/lib/admin-i18n";
import { pickText } from "@/lib/catalog-types";
import type { AdminReview } from "@/lib/reviews";

export function ReviewList({ reviews }: { reviews: AdminReview[] }) {
  const { lang } = useLang();
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const k = a.reviews;

  const run = (fn: () => Promise<{ ok: boolean }>) =>
    startTransition(async () => {
      const r = await fn();
      setFailed(!r.ok);
      router.refresh();
    });

  const pending = reviews.filter((r) => !r.approved);
  const published = reviews.filter((r) => r.approved);

  const item = (r: AdminReview) => (
    <li key={r.id} aria-label={r.name} className="rounded-2xl border border-bark/10 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href={`/product/${encodeURIComponent(r.productId)}`} target="_blank" className="text-sm font-semibold text-amber hover:text-bark">
          {pickText(r.productName, lang)}
        </Link>
        <span className="text-xs text-bark/50" dir="ltr">{r.date}</span>
      </div>
      <p className="mt-1 flex items-center gap-2 text-sm">
        <Stars value={r.rating} />
        <span className="text-bark/60" dir="ltr">{r.rating}/5</span>
        <span className="font-semibold text-bark-deep">{r.name}</span>
        <span className="rounded-full bg-bark/10 px-2 py-0.5 text-[11px] font-semibold uppercase">{r.lang}</span>
      </p>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-bark/80" dir="auto">{r.text}</p>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => run(() => setReviewApprovedAction(r.id, !r.approved))}
          className={
            r.approved
              ? "rounded-xl border border-bark/15 bg-white px-3 py-1.5 text-sm font-semibold text-bark hover:border-honey disabled:opacity-50"
              : "rounded-xl bg-leaf px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          }
        >
          {r.approved ? k.hide[lang] : `✓ ${k.approve[lang]}`}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (confirm(k.confirmDelete[lang])) run(() => deleteReviewAction(r.id));
          }}
          className="rounded-xl border border-bark/15 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:border-red-300 disabled:opacity-50"
        >
          {k.delete[lang]}
        </button>
      </div>
    </li>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-bark-deep">{k.title[lang]}</h1>
        <p className="mt-2 rounded-xl bg-honey/10 px-4 py-2.5 text-xs text-bark/70">{k.intro[lang]}</p>
      </div>
      {failed && <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{k.failed[lang]}</p>}

      <section aria-labelledby="pending-title">
        <h2 id="pending-title" className="font-display text-lg font-bold text-bark-deep">
          {k.pending[lang]} <span className="text-bark/50">({pending.length})</span>
        </h2>
        {pending.length ? <ul className="mt-3 space-y-3">{pending.map(item)}</ul> : <p className="mt-2 text-sm text-bark/60">{k.nonePending[lang]}</p>}
      </section>

      <section aria-labelledby="published-title">
        <h2 id="published-title" className="font-display text-lg font-bold text-bark-deep">
          {k.published[lang]} <span className="text-bark/50">({published.length})</span>
        </h2>
        {published.length ? <ul className="mt-3 space-y-3">{published.map(item)}</ul> : <p className="mt-2 text-sm text-bark/60">{k.nonePublished[lang]}</p>}
      </section>
    </div>
  );
}
