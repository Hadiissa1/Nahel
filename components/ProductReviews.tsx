"use client";

import { startTransition, useActionState, useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import { Stars } from "@/components/Stars";
import { submitReviewAction, type ReviewState } from "@/app/reviews/actions";
import { t } from "@/lib/translations";
import { REVIEW_LIMITS, type RatingSummary, type Review } from "@/lib/review-types";

/** Reviews section of a product page: summary, published reviews, and the form. */
export function ProductReviews({
  productId,
  rating,
  reviews,
}: {
  productId: string;
  rating: RatingSummary | null;
  reviews: Review[];
}) {
  const { lang } = useLang();
  const r = t.reviews;
  const [writing, setWriting] = useState(false);

  return (
    <section aria-labelledby="reviews-title" className="mt-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="reviews-title" className="font-display text-2xl font-bold text-bark-deep">
            {r.title[lang]}
          </h2>
          {rating ? (
            <p className="mt-1 flex items-center gap-2 text-sm text-bark/70">
              <Stars value={rating.avg} className="text-lg" />
              {(rating.count === 1 ? r.summaryOne : r.summary)[lang]
                .replace("{a}", String(rating.avg))
                .replace("{n}", String(rating.count))}
            </p>
          ) : (
            <p className="mt-1 text-sm text-bark/60">{r.none[lang]}</p>
          )}
        </div>
        {!writing && (
          <button
            type="button"
            onClick={() => setWriting(true)}
            className="rounded-full border border-bark/20 bg-white px-5 py-2 text-sm font-semibold text-bark transition-colors hover:border-honey hover:text-amber"
          >
            ✍️ {r.write[lang]}
          </button>
        )}
      </div>

      {writing && <ReviewForm productId={productId} />}

      {reviews.length > 0 && (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {reviews.map((rv) => (
            <li key={rv.id} className="rounded-2xl border border-bark/10 bg-white p-5" lang={rv.lang} dir={rv.lang === "ar" ? "rtl" : "ltr"}>
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-bark-deep">{rv.name}</span>
                <time dateTime={rv.date} className="text-xs text-bark/50" dir="ltr">
                  {rv.date}
                </time>
              </div>
              <p className="mt-1 flex items-center gap-2">
                <Stars value={rv.rating} />
                <span className="sr-only">{rv.rating}/5</span>
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-bark/80">{rv.text}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ReviewForm({ productId }: { productId: string }) {
  const { lang } = useLang();
  const r = t.reviews;
  const [state, dispatch, pending] = useActionState<ReviewState, FormData>(submitReviewAction, {});
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);

  if (state.done) {
    return (
      <p role="status" className="mt-5 rounded-2xl bg-leaf/10 px-5 py-4 text-sm font-medium text-leaf">
        ✓ {r.done[lang]}
      </p>
    );
  }

  const field =
    "mt-1 w-full rounded-xl border border-bark/15 bg-white px-3.5 py-2.5 text-sm text-bark outline-none focus:border-honey focus:ring-2 focus:ring-honey/30";

  return (
    <form
      // onSubmit (not action=) so React doesn't clear the fields on errors.
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => dispatch(fd));
      }}
      noValidate
      aria-label={r.write[lang]}
      className="mt-5 space-y-4 rounded-2xl border border-bark/10 bg-white p-5"
    >
      <input type="hidden" name="product" value={productId} />
      <input type="hidden" name="lang" value={lang} />
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-bark">{r.yourRating[lang]}</legend>
        <div className="mt-1 flex gap-1" dir="ltr" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer" onMouseEnter={() => setHover(n)}>
              <input
                type="radio"
                name="rating"
                value={n}
                checked={stars === n}
                onChange={() => setStars(n)}
                className="peer sr-only"
              />
              <span className="sr-only">{r.star[lang].replace("{n}", String(n))}</span>
              <span
                aria-hidden="true"
                className={`block text-3xl leading-none transition-colors peer-focus-visible:rounded peer-focus-visible:ring-2 peer-focus-visible:ring-honey ${
                  (hover || stars) >= n ? "text-amber" : "text-bark/20"
                }`}
              >
                ★
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block text-sm font-medium text-bark">
        {r.name[lang]}
        <input name="name" maxLength={REVIEW_LIMITS.name} autoComplete="given-name" className={field} />
      </label>
      <label className="block text-sm font-medium text-bark">
        {r.text[lang]}
        <textarea
          name="text"
          rows={4}
          maxLength={REVIEW_LIMITS.textMax}
          placeholder={r.textHint[lang]}
          className={`${field} resize-y`}
        />
      </label>

      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {r[`err_${state.error}`][lang]}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-bark/55">{r.moderation[lang]}</p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-gradient-to-br from-honey to-amber px-6 py-2.5 text-sm font-semibold text-white shadow disabled:opacity-60"
        >
          {pending ? r.sending[lang] : r.submit[lang]}
        </button>
      </div>
    </form>
  );
}
