"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import { saveArticleAction, type SaveState } from "@/app/admin/actions";
import { a } from "@/lib/admin-i18n";
import { photoUrl, pickText } from "@/lib/catalog-types";
import { ARTICLE_LIMITS, slugify, type AdminArticle } from "@/lib/article-types";
import type { LocalizedText } from "@/lib/data";
import { MAX_UPLOAD, preparePhoto } from "@/lib/prepare-photo";

type ProductOption = { id: string; name: LocalizedText };

export function ArticleForm({ article, products }: { article?: AdminArticle; products: ProductOption[] }) {
  const { lang } = useLang();
  const [state, dispatch, pending] = useActionState<SaveState, FormData>(saveArticleAction, {});
  const errors = state.errors ?? {};
  const err = (f: string) => (errors[f] ? (a.errors[errors[f]!] ?? a.errors.invalid)[lang] : null);
  const k = a.articles;

  const [slug, setSlug] = useState(article?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(article));
  const [chosen, setChosen] = useState<string[]>(article?.products ?? []);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(article?.photo ? photoUrl(article.photo, "sm") : null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
  }, [preview]);

  const field = (f: string) =>
    `mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-bark outline-none focus:border-honey focus:ring-2 focus:ring-honey/30 ${
      errors[f] ? "border-red-400" : "border-bark/15"
    }`;
  const label = "block text-sm font-medium text-bark";
  const msg = (f: string) => err(f) && <p className="mt-1 text-xs text-red-700">{err(f)}</p>;

  return (
    <form
      // onSubmit (not action=) so React doesn't clear the fields on errors.
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        if (photo) fd.set("photo", photo);
        if (removePhoto) fd.set("remove_photo", "1");
        startTransition(() => dispatch(fd));
      }}
      noValidate
      className="mx-auto max-w-3xl space-y-6 px-4 py-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-bark-deep">{article ? k.editTitle[lang] : k.newTitle[lang]}</h1>
        <Link href="/admin/articles" className="text-sm font-semibold text-amber hover:text-bark">{k.back[lang]}</Link>
      </div>
      {Object.keys(errors).length > 0 && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
          {errors.form ? err("form") : a.form.fixErrors[lang]}
        </p>
      )}
      <input type="hidden" name="id" value={article?.id ?? ""} />

      <section className="grid gap-4 rounded-2xl border border-bark/10 bg-white p-5 sm:grid-cols-2">
        <div>
          <label htmlFor="title_ar" className={label}>{k.titleAr[lang]}</label>
          <input id="title_ar" name="title_ar" defaultValue={article?.title.ar} maxLength={ARTICLE_LIMITS.title} dir="rtl" className={field("title_ar")} />
          {msg("title_ar")}
        </div>
        <div>
          <label htmlFor="title_en" className={label}>{k.titleEn[lang]}</label>
          <input
            id="title_en"
            name="title_en"
            defaultValue={article?.title.en}
            maxLength={ARTICLE_LIMITS.title}
            dir="ltr"
            onChange={(e) => {
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            className={field("title_en")}
          />
          {msg("title_en")}
        </div>
        <div>
          <label htmlFor="summary_ar" className={label}>{k.summaryAr[lang]}</label>
          <textarea id="summary_ar" name="summary_ar" defaultValue={article?.summary.ar} maxLength={ARTICLE_LIMITS.summary} rows={2} dir="rtl" className={`${field("summary_ar")} resize-y`} />
        </div>
        <div>
          <label htmlFor="summary_en" className={label}>{k.summaryEn[lang]}</label>
          <textarea id="summary_en" name="summary_en" defaultValue={article?.summary.en} maxLength={ARTICLE_LIMITS.summary} rows={2} dir="ltr" className={`${field("summary_en")} resize-y`} />
        </div>
        <p className="text-xs text-bark/60 sm:col-span-2">{k.formatHint[lang]}</p>
        <div>
          <label htmlFor="body_ar" className={label}>{k.bodyAr[lang]}</label>
          <textarea id="body_ar" name="body_ar" defaultValue={article?.body.ar} maxLength={ARTICLE_LIMITS.body} rows={14} dir="rtl" className={`${field("body_ar")} resize-y`} />
          {msg("body_ar")}
        </div>
        <div>
          <label htmlFor="body_en" className={label}>{k.bodyEn[lang]}</label>
          <textarea id="body_en" name="body_en" defaultValue={article?.body.en} maxLength={ARTICLE_LIMITS.body} rows={14} dir="ltr" className={`${field("body_en")} resize-y`} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="slug" className={label}>{k.slug[lang]}</label>
          <div className="mt-1.5 flex items-center gap-1 text-sm text-bark/60" dir="ltr">
            <span>/blog/</span>
            <input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value.toLowerCase());
              }}
              maxLength={ARTICLE_LIMITS.slug}
              className={`${field("slug")} mt-0`}
            />
          </div>
          {msg("slug") || <p className="mt-1 text-xs text-bark/55">{k.slugHint[lang]}</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-bark/10 bg-white p-5">
        <h2 className="text-sm font-semibold text-bark">{k.photo[lang]}</h2>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <div className="h-28 w-44 overflow-hidden rounded-xl border border-bark/10 bg-gradient-to-br from-honey-light to-amber">
            {preview && !removePhoto && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              setPhotoError(null);
              if (!f.type.startsWith("image/")) return setPhotoError(a.errors.photo_format[lang]);
              const ready = await preparePhoto(f);
              if (ready.size > MAX_UPLOAD) return setPhotoError(a.errors.photo_too_large[lang]);
              setPhoto(ready);
              setRemovePhoto(false);
              setPreview(URL.createObjectURL(ready));
            }}
          />
          <div className="flex flex-col gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} className="rounded-xl border border-bark/15 bg-white px-4 py-2 text-sm font-semibold text-bark hover:border-honey">
              🖼️ {k.choosePhoto[lang]}
            </button>
            {preview && !removePhoto && (
              <button
                type="button"
                onClick={() => {
                  setPhoto(null);
                  setPreview(null);
                  setRemovePhoto(Boolean(article?.photo));
                }}
                className="text-sm font-semibold text-red-700 hover:underline"
              >
                {k.removePhoto[lang]}
              </button>
            )}
          </div>
        </div>
        {(photoError || err("photo")) && <p className="mt-2 text-xs text-red-700">{photoError ?? err("photo")}</p>}
      </section>

      <fieldset className="rounded-2xl border border-bark/10 bg-white p-5">
        <legend className="px-1 text-sm font-semibold text-bark">{k.products[lang]}</legend>
        <div className="mt-2 grid max-h-64 gap-1.5 overflow-y-auto sm:grid-cols-2">
          {products.map((p) => {
            const on = chosen.includes(p.id);
            return (
              <label key={p.id} className="flex items-center gap-2 text-sm text-bark/80">
                <input
                  type="checkbox"
                  name="products"
                  value={p.id}
                  checked={on}
                  disabled={!on && chosen.length >= ARTICLE_LIMITS.products}
                  onChange={() => setChosen((c) => (on ? c.filter((x) => x !== p.id) : [...c, p.id]))}
                  className="h-4 w-4 accent-amber"
                />
                {pickText(p.name, lang)}
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className="flex items-center gap-3 rounded-2xl border border-bark/10 bg-white p-5 text-sm font-medium text-bark">
        <input type="checkbox" name="published" defaultChecked={article?.published ?? true} className="h-5 w-5 accent-amber" />
        {k.publish[lang]}
      </label>

      <div className="flex justify-end gap-3">
        <Link href="/admin/articles" className="rounded-xl border border-bark/15 bg-white px-5 py-2.5 text-sm font-semibold text-bark">{k.cancel[lang]}</Link>
        <button type="submit" disabled={pending} className="rounded-xl bg-gradient-to-br from-honey to-amber px-6 py-2.5 text-sm font-semibold text-white shadow disabled:opacity-60">
          {pending ? k.saving[lang] : k.save[lang]}
        </button>
      </div>
    </form>
  );
}
