"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import { Icon } from "@/components/icons";
import { productIcon } from "@/components/product-icons";
import { saveProductAction, type SaveState } from "@/app/admin/actions";
import { a } from "@/lib/admin-i18n";
import { t } from "@/lib/translations";
import { CATEGORIES, photoUrl, type AdminProduct, type CategoryId } from "@/lib/catalog-types";

const MAX_SIDE = 1600;
const MAX_UPLOAD = 4 * 1024 * 1024;

/**
 * Shrink a camera/gallery photo in the browser before upload: phone photos are
 * often 5–12 MB, this sends ~300 KB instead (fast on mobile data). The server
 * re-encodes it again in any case.
 */
async function preparePhoto(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.86));
    if (blob) return new File([blob], "photo.jpg", { type: "image/jpeg" });
  } catch {
    /* browser can't decode it: fall back to the original file */
  }
  return file;
}

type Row = { key: string; id: string; label: string; price: string; sale: string; stock: string };
let rowKey = 0;
const newRow = (r: Partial<Row> = {}): Row => ({
  key: `r${rowKey++}`,
  id: "",
  label: "",
  price: "",
  sale: "",
  stock: "",
  ...r,
});

export function ProductForm({ product }: { product?: AdminProduct }) {
  const { lang } = useLang();
  const [state, dispatch, pending] = useActionState<SaveState, FormData>(saveProductAction, {});
  const errors = state.errors ?? {};
  const err = (k: string) => (errors[k] ? (a.errors[errors[k]!]?.[lang] ?? a.errors.invalid[lang]) : null);

  const [category, setCategory] = useState<CategoryId>(product?.category ?? "honey");
  const [rows, setRows] = useState<Row[]>(
    product?.variants.length
      ? product.variants.map((v) =>
          newRow({
            id: v.id,
            label: v.label,
            // On sale: the catalog price is the sale price, wasPrice the normal one.
            price: (v.wasPrice ?? v.price) === null ? "" : ((v.wasPrice ?? v.price)! / 100).toString(),
            sale: v.wasPrice !== null && v.price !== null ? (v.price / 100).toString() : "",
            stock: v.stock === null ? "" : String(v.stock),
          }),
        )
      : [newRow()],
  );

  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    product?.photo ? photoUrl(product.photo, "lg") : null,
  );
  const [removePhoto, setRemovePhoto] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  // True once a new photo is picked after the last submit: the server's error
  // about the previous file then no longer applies.
  const [pickedSinceSubmit, setPickedSinceSubmit] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  // Free the preview object URL when it changes or the form unmounts.
  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again
    if (!file) return;
    setPhotoError(null);
    if (!file.type.startsWith("image/")) {
      setPhotoError(a.errors.photo_format[lang]);
      return;
    }
    setPhotoBusy(true);
    const ready = await preparePhoto(file);
    setPhotoBusy(false);
    if (ready.size > MAX_UPLOAD) {
      setPhotoError(a.errors.photo_too_large[lang]);
      return;
    }
    setPhoto(ready);
    setPickedSinceSubmit(true);
    setRemovePhoto(false);
    setPreview(URL.createObjectURL(ready));
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (photo) fd.set("photo", photo);
    if (removePhoto) fd.set("remove_photo", "1");
    setPickedSinceSubmit(false);
    startTransition(() => dispatch(fd));
  };

  const field =
    "mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-bark outline-none focus:border-honey focus:ring-2 focus:ring-honey/30";
  const border = (k: string) => (errors[k] ? "border-red-400" : "border-bark/15");

  const text = (name: string, label: string, value: string, opts: { area?: boolean; max: number; dir?: "rtl" | "ltr" }) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-bark">
        {label}
      </label>
      {opts.area ? (
        <textarea id={name} name={name} defaultValue={value} maxLength={opts.max} rows={3} dir={opts.dir} className={`${field} ${border(name)} resize-y`} />
      ) : (
        <input id={name} name={name} defaultValue={value} maxLength={opts.max} dir={opts.dir} className={`${field} ${border(name)}`} />
      )}
      {err(name) && <p className="mt-1 text-xs text-red-700">{err(name)}</p>}
    </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-bark-deep">
          {product ? a.form.editTitle[lang] : a.form.newTitle[lang]}
        </h1>
        <Link href="/admin" className="text-sm font-semibold text-amber hover:text-bark">
          {a.form.back[lang]}
        </Link>
      </div>

      {(Object.keys(errors).length > 0) && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
          {errors.form ? err("form") : a.form.fixErrors[lang]}
        </p>
      )}

      <input type="hidden" name="id" value={product?.id ?? ""} />

      {/* Photo */}
      <section className="rounded-2xl border border-bark/10 bg-white p-5">
        <h2 className="text-sm font-semibold text-bark">{a.form.photo[lang]}</h2>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="h-40 w-40 shrink-0 overflow-hidden rounded-2xl border border-bark/10">
            {preview && !removePhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center bg-gradient-to-br from-honey-light to-amber">
                <Icon name={productIcon(product?.id ?? "", category)} className="h-12 w-12 text-white" stroke="currentColor" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPick} aria-hidden="true" tabIndex={-1} />
            <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={onPick} aria-hidden="true" tabIndex={-1} />
            <button type="button" onClick={() => cameraRef.current?.click()} disabled={photoBusy} className="rounded-xl bg-gradient-to-br from-honey to-amber px-4 py-2.5 text-sm font-semibold text-white shadow disabled:opacity-60">
              📷 {a.form.takePhoto[lang]}
            </button>
            <button type="button" onClick={() => galleryRef.current?.click()} disabled={photoBusy} className="rounded-xl border border-bark/15 bg-white px-4 py-2.5 text-sm font-semibold text-bark hover:border-honey disabled:opacity-60">
              🖼️ {a.form.gallery[lang]}
            </button>
            {preview && !removePhoto && (
              <button
                type="button"
                onClick={() => {
                  setPhoto(null);
                  setPreview(null);
                  // Only an already-saved photo needs deleting on the server.
                  setRemovePhoto(Boolean(product?.photo));
                }}
                className="text-sm font-semibold text-red-700 hover:underline"
              >
                {a.form.removePhoto[lang]}
              </button>
            )}
            {photoBusy && <p className="text-xs text-bark/60">{a.form.preparing[lang]}</p>}
            {(photoError || (!pickedSinceSubmit && err("photo"))) && (
              <p className="text-xs text-red-700">{photoError ?? err("photo")}</p>
            )}
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="space-y-4 rounded-2xl border border-bark/10 bg-white p-5">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-bark">
            {a.form.category[lang]}
          </label>
          <select
            id="category"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryId)}
            className={`${field} ${border("category")}`}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t.nav[c][lang]}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-bark/60">{a.form.oneNameHint[lang]}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {text("name_ar", a.form.nameAr[lang], product?.name.ar ?? "", { max: 120, dir: "rtl" })}
          {text("name_en", a.form.nameEn[lang], product?.name.en ?? "", { max: 120, dir: "ltr" })}
          {text("origin_ar", a.form.originAr[lang], product?.origin.ar ?? "", { max: 80, dir: "rtl" })}
          {text("origin_en", a.form.originEn[lang], product?.origin.en ?? "", { max: 80, dir: "ltr" })}
          {text("desc_ar", a.form.descAr[lang], product?.desc.ar ?? "", { area: true, max: 1000, dir: "rtl" })}
          {text("desc_en", a.form.descEn[lang], product?.desc.en ?? "", { area: true, max: 1000, dir: "ltr" })}
        </div>
      </section>

      {/* Sizes / prices / stock */}
      <section className="rounded-2xl border border-bark/10 bg-white p-5">
        <h2 className="text-sm font-semibold text-bark">{a.form.options[lang]}</h2>
        <p className="mt-1 text-xs text-bark/60">{a.form.optionsHint[lang]}</p>
        {err("variants") && <p className="mt-2 text-xs text-red-700">{err("variants")}</p>}
        <div className="mt-3 space-y-3">
          {rows.map((r, i) => (
            <div
              key={r.key}
              className="grid grid-cols-2 items-start gap-2 border-b border-bark/5 pb-3 last:border-0 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] sm:border-0 sm:pb-0"
            >
              <input type="hidden" name="variant_id" value={r.id} />
              {(
                [
                  ["label", "variant_label", a.form.optionLabel[lang], "text"],
                  ["price", "variant_price", a.form.price[lang], "decimal"],
                  ["sale", "variant_sale", a.form.salePrice[lang], "decimal"],
                  ["stock", "variant_stock", a.form.stock[lang], "numeric"],
                ] as const
              ).map(([key, name, label, mode]) => (
                <div key={key}>
                  <label className="block text-[11px] font-medium text-bark/70">
                    {label}
                    <input
                      name={name}
                      value={r[key]}
                      inputMode={mode}
                      maxLength={key === "label" ? 30 : 10}
                      dir="ltr"
                      onChange={(e) =>
                        setRows((rs) => rs.map((x) => (x.key === r.key ? { ...x, [key]: e.target.value } : x)))
                      }
                      className={`${field} mt-1 ${border(`${name}_${i}`)}`}
                    />
                  </label>
                  {err(`${name}_${i}`) && <p className="mt-1 text-[11px] text-red-700">{err(`${name}_${i}`)}</p>}
                </div>
              ))}
              <button
                type="button"
                disabled={rows.length === 1}
                onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                aria-label={a.form.removeOption[lang]}
                title={a.form.removeOption[lang]}
                className="col-span-2 grid h-10 w-10 place-items-center justify-self-end rounded-xl border border-bark/15 sm:col-span-1 sm:mt-6 sm:justify-self-auto text-bark/60 hover:border-red-300 hover:text-red-700 disabled:opacity-30"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        {rows.length < 10 && (
          <button
            type="button"
            onClick={() => setRows((rs) => [...rs, newRow()])}
            className="mt-3 rounded-xl border border-dashed border-bark/25 px-4 py-2 text-sm font-semibold text-bark hover:border-honey"
          >
            + {a.form.addOption[lang]}
          </button>
        )}
      </section>

      <label className="flex items-center gap-3 rounded-2xl border border-bark/10 bg-white p-5 text-sm font-medium text-bark">
        <input type="checkbox" name="visible" defaultChecked={product?.visible ?? true} className="h-5 w-5 accent-amber" />
        {a.form.visible[lang]}
      </label>

      <div className="flex justify-end gap-3">
        <Link href="/admin" className="rounded-xl border border-bark/15 bg-white px-5 py-2.5 text-sm font-semibold text-bark">
          {a.form.cancel[lang]}
        </Link>
        <button
          type="submit"
          disabled={pending || photoBusy}
          className="rounded-xl bg-gradient-to-br from-honey to-amber px-6 py-2.5 text-sm font-semibold text-white shadow disabled:opacity-60"
        >
          {pending ? a.form.saving[lang] : a.form.save[lang]}
        </button>
      </div>
    </form>
  );
}
