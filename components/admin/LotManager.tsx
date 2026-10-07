"use client";

import { startTransition, useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { deleteLotAction, saveLotAction, type LotState } from "@/app/admin/actions";
import { a } from "@/lib/admin-i18n";
import { pickText } from "@/lib/catalog-types";
import type { LocalizedText } from "@/lib/data";
import type { AdminLot } from "@/lib/lot-types";

type ProductOption = { id: string; name: LocalizedText };

export function LotManager({
  lots,
  products,
  qr,
  hasSite,
}: {
  lots: AdminLot[];
  products: ProductOption[];
  qr: Record<string, string>;
  hasSite: boolean;
}) {
  const { lang } = useLang();
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [added, setAdded] = useState(0);
  const [busy, startDelete] = useTransition();
  const [failed, setFailed] = useState(false);
  const k = a.lots;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-bark-deep">{k.title[lang]}</h1>
        <p className="mt-2 rounded-xl bg-honey/10 px-4 py-2.5 text-xs text-bark/70">{k.intro[lang]}</p>
        {!hasSite && (
          <p className="mt-2 rounded-xl bg-amber/10 px-4 py-2.5 text-xs font-medium text-amber">{k.qrNeedsSite[lang]}</p>
        )}
      </div>

      <section>
        <h2 className="mb-2 font-display text-lg font-bold text-bark-deep">{k.newTitle[lang]}</h2>
        <LotForm key={`new-${added}`} products={products} onSaved={() => setAdded((n) => n + 1)} />
      </section>

      <section>
        <h2 className="font-display text-lg font-bold text-bark-deep">{k.list[lang]}</h2>
        {failed && <p role="alert" className="mt-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{k.failed[lang]}</p>}
        {lots.length === 0 ? (
          <p className="mt-2 text-sm text-bark/60">{k.empty[lang]}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {lots.map((l) =>
              editing === l.id ? (
                <li key={l.id}>
                  <LotForm lot={l} products={products} onSaved={() => setEditing(null)} onCancel={() => setEditing(null)} />
                </li>
              ) : (
                <li key={l.id} aria-label={l.code} className="flex flex-wrap gap-4 rounded-2xl border border-bark/10 bg-white p-4">
                  {qr[l.id] && (
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="h-28 w-28 [&_svg]:h-full [&_svg]:w-full"
                        role="img"
                        aria-label={`QR ${l.code}`}
                        // SVG generated on our server from the lot's URL.
                        dangerouslySetInnerHTML={{ __html: qr[l.id] }}
                      />
                      <a
                        href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr[l.id])}`}
                        download={`lot-${l.code}.svg`}
                        className="text-[11px] font-semibold text-amber hover:text-bark"
                      >
                        {k.downloadQr[lang]}
                      </a>
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-1 text-sm">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-base font-bold text-bark-deep" dir="ltr">{l.code}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${l.current ? "bg-leaf/15 text-leaf" : "bg-bark/10 text-bark/60"}`}>
                        {l.current ? k.currentBadge[lang] : k.archivedBadge[lang]}
                      </span>
                    </p>
                    <p className="font-medium text-bark">{pickText(l.productName, lang)}</p>
                    <p className="text-bark/70">
                      {[l.harvestOn, pickText(l.region, lang)].filter(Boolean).join(" · ")}
                    </p>
                    {l.certificateUrl && (
                      <a href={l.certificateUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-xs font-semibold text-amber hover:text-bark">
                        📄 {k.viewPdf[lang]}
                      </a>
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(l.id)}
                      className="rounded-xl border border-bark/15 bg-white px-3 py-1.5 text-sm font-semibold text-bark hover:border-honey"
                    >
                      {k.edit[lang]}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        if (!confirm(k.confirmDelete[lang])) return;
                        startDelete(async () => {
                          const r = await deleteLotAction(l.id);
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
              ),
            )}
          </ul>
        )}
      </section>
    </div>
  );
}

function LotForm({
  lot,
  products,
  onSaved,
  onCancel,
}: {
  lot?: AdminLot;
  products: ProductOption[];
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const { lang } = useLang();
  const [state, dispatch, saving] = useActionState<LotState, FormData>(async (prev, fd) => {
    const r = await saveLotAction(prev, fd);
    if (r.saved) onSaved();
    return r;
  }, {});
  const [removePdf, setRemovePdf] = useState(false);
  const k = a.lots;
  const errors = state.errors ?? {};
  const err = (f: string) => (errors[f] ? (a.errors[errors[f]!] ?? a.errors.invalid)[lang] : null);
  const field = (f: string) =>
    `mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm text-bark outline-none focus:border-honey focus:ring-2 focus:ring-honey/30 ${
      errors[f] ? "border-red-400" : "border-bark/15"
    }`;
  const label = "block text-xs font-medium text-bark/80";
  const p = lot?.id ?? "new";
  const msg = (f: string) => err(f) && <p className="mt-1 text-[11px] text-red-700">{err(f)}</p>;

  return (
    <form
      // onSubmit (not action=) so React doesn't clear the fields on errors.
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        if (removePdf) fd.set("remove_certificate", "1");
        startTransition(() => dispatch(fd));
      }}
      noValidate
      aria-label={lot ? lot.code : k.newTitle[lang]}
      className="space-y-3 rounded-2xl border border-bark/10 bg-white p-4"
    >
      <input type="hidden" name="id" value={lot?.id ?? ""} />
      {errors.form && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{err("form")}</p>}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor={`${p}-code`} className={label}>{k.code[lang]}</label>
          <input id={`${p}-code`} name="code" defaultValue={lot?.code} maxLength={30} dir="ltr" placeholder="OAK-2026-01" className={`${field("code")} uppercase`} />
          {msg("code") || <p className="mt-1 text-[11px] text-bark/50">{k.codeHint[lang]}</p>}
        </div>
        <div>
          <label htmlFor={`${p}-product`} className={label}>{k.product[lang]}</label>
          <select id={`${p}-product`} name="product" defaultValue={lot?.productId ?? ""} className={field("product")}>
            <option value="" disabled>{k.chooseProduct[lang]}</option>
            {products.map((pr) => (
              <option key={pr.id} value={pr.id}>{pickText(pr.name, lang)}</option>
            ))}
          </select>
          {msg("product")}
        </div>
        <div>
          <label htmlFor={`${p}-harvest`} className={label}>{k.harvest[lang]}</label>
          <input id={`${p}-harvest`} name="harvest_on" type="date" defaultValue={lot?.harvestOn ?? ""} dir="ltr" className={field("harvest_on")} />
          {msg("harvest_on")}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${p}-rar`} className={label}>{k.regionAr[lang]}</label>
          <input id={`${p}-rar`} name="region_ar" defaultValue={lot?.region.ar} maxLength={120} dir="rtl" className={field("region_ar")} />
        </div>
        <div>
          <label htmlFor={`${p}-ren`} className={label}>{k.regionEn[lang]}</label>
          <input id={`${p}-ren`} name="region_en" defaultValue={lot?.region.en} maxLength={120} dir="ltr" className={field("region_en")} />
        </div>
        <div>
          <label htmlFor={`${p}-nar`} className={label}>{k.notesAr[lang]}</label>
          <textarea id={`${p}-nar`} name="notes_ar" defaultValue={lot?.notes.ar} maxLength={1000} rows={2} dir="rtl" className={`${field("notes_ar")} resize-y`} />
        </div>
        <div>
          <label htmlFor={`${p}-nen`} className={label}>{k.notesEn[lang]}</label>
          <textarea id={`${p}-nen`} name="notes_en" defaultValue={lot?.notes.en} maxLength={1000} rows={2} dir="ltr" className={`${field("notes_en")} resize-y`} />
        </div>
      </div>
      <div>
        <label htmlFor={`${p}-pdf`} className={label}>{k.certificate[lang]}</label>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <input id={`${p}-pdf`} name="certificate" type="file" accept="application/pdf,.pdf" className="text-sm text-bark file:me-3 file:rounded-xl file:border-0 file:bg-honey/15 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-bark" />
          {lot?.certificateUrl && !removePdf && (
            <>
              <a href={lot.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-amber">📄 {k.viewPdf[lang]}</a>
              <button type="button" onClick={() => setRemovePdf(true)} className="text-xs font-semibold text-red-700 hover:underline">{k.removePdf[lang]}</button>
            </>
          )}
        </div>
        {msg("certificate")}
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-bark">
        <input type="checkbox" name="current" defaultChecked={lot?.current ?? true} className="h-5 w-5 accent-amber" />
        {k.current[lang]}
      </label>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-xl border border-bark/15 bg-white px-4 py-2 text-sm font-semibold text-bark">
            {k.cancel[lang]}
          </button>
        )}
        <button type="submit" disabled={saving} className="rounded-xl bg-gradient-to-br from-honey to-amber px-5 py-2 text-sm font-semibold text-white shadow disabled:opacity-60">
          {saving ? k.saving[lang] : lot ? k.save[lang] : `+ ${k.create[lang]}`}
        </button>
      </div>
    </form>
  );
}
