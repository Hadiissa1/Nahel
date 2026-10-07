"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { Icon } from "@/components/icons";
import { productIcon } from "@/components/product-icons";
import {
  deleteProductAction,
  setStockAction,
  setVisibleAction,
} from "@/app/admin/actions";
import { a } from "@/lib/admin-i18n";
import { t } from "@/lib/translations";
import {
  CATEGORIES,
  LOW_STOCK,
  formatPrice,
  isOutOfStock,
  photoUrl,
  pickText,
  type AdminProduct,
  type CategoryId,
  type Variant,
} from "@/lib/catalog-types";

type FlashKey = "created" | "updated" | "deleted" | "stockSaved" | "failed";
type Flash = { kind: "ok" | "error"; key: FlashKey } | null;

export function ProductList({
  products,
  saved,
}: {
  products: AdminProduct[];
  saved?: string;
}) {
  const { lang } = useLang();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<"all" | CategoryId>("all");
  // Store a message key (not text) so it follows language changes.
  const [flash, setFlash] = useState<Flash>(
    saved === "created" || saved === "updated" ? { kind: "ok", key: saved } : null,
  );
  const [pending, startTransition] = useTransition();

  const stats = useMemo(() => {
    const variants = products.flatMap((p) => p.variants);
    return {
      total: products.length,
      hidden: products.filter((p) => !p.visible).length,
      out: variants.filter(isOutOfStock).length,
      low: variants.filter((v) => v.stock !== null && v.stock > 0 && v.stock <= LOW_STOCK)
        .length,
    };
  }, [products]);

  const shown = products.filter((p) => {
    if (cat !== "all" && p.category !== cat) return false;
    const q = query.trim().toLowerCase();
    return !q || `${p.name.ar} ${p.name.en}`.toLowerCase().includes(q);
  });

  const run = (fn: () => Promise<{ ok: boolean }>, okKey?: FlashKey) =>
    startTransition(async () => {
      const { ok } = await fn();
      setFlash(ok ? (okKey ? { kind: "ok", key: okKey } : null) : { kind: "error", key: "failed" });
      router.refresh();
    });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["total", stats.total, "text-bark-deep"],
            ["hidden", stats.hidden, "text-bark/70"],
            ["out", stats.out, "text-red-700"],
            ["low", stats.low, "text-amber"],
          ] as const
        ).map(([k, v, color]) => (
          <div key={k} className="rounded-2xl border border-bark/10 bg-white p-4">
            <dt className="text-xs font-medium text-bark/60">{a.stats[k][lang]}</dt>
            <dd className={`mt-1 text-2xl font-bold ${color}`}>{v}</dd>
          </div>
        ))}
      </dl>

      {flash && (
        <p
          role="status"
          className={`mt-4 rounded-xl px-4 py-2.5 text-sm font-medium ${
            flash.kind === "ok" ? "bg-leaf/15 text-leaf" : "bg-red-50 text-red-700"
          }`}
        >
          {a.list[flash.key][lang]}
        </p>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["all", ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${
                cat === c
                  ? "bg-amber text-white"
                  : "border border-bark/15 bg-white text-bark/80 hover:border-honey"
              }`}
            >
              {c === "all" ? a.list.all[lang] : t.nav[c][lang]}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={a.list.search[lang]}
            aria-label={a.list.search[lang]}
            className="w-full rounded-full border border-bark/15 bg-white px-4 py-2 text-sm outline-none focus:border-honey sm:w-56"
          />
          <Link
            href="/admin/products/new"
            className="shrink-0 whitespace-nowrap rounded-full bg-gradient-to-br from-honey to-amber px-4 py-2 text-sm font-semibold text-white shadow"
          >
            + {a.list.add[lang]}
          </Link>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="mt-10 text-center text-bark/60">{a.list.empty[lang]}</p>
      ) : (
        <ul className={`mt-5 space-y-3 ${pending ? "opacity-70" : ""}`}>
          {shown.map((p) => (
            <li
              key={p.id}
              className={`rounded-2xl border bg-white p-4 ${p.visible ? "border-bark/10" : "border-dashed border-bark/25 bg-white/60"}`}
            >
              <div className="flex gap-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                  {p.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrl(p.photo, "sm")} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-honey-light to-amber">
                      <Icon name={productIcon(p.id, p.category)} className="h-8 w-8 text-white" stroke="currentColor" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-bark-deep">{pickText(p.name, lang)}</h2>
                    <span className="rounded-full bg-honey/15 px-2 py-0.5 text-[11px] font-semibold text-amber">
                      {t.nav[p.category][lang]}
                    </span>
                    {!p.visible && (
                      <span className="rounded-full bg-bark/10 px-2 py-0.5 text-[11px] font-semibold text-bark/70">
                        {a.list.hidden[lang]}
                      </span>
                    )}
                  </div>

                  <table className="mt-2 w-full max-w-md text-sm">
                    <tbody>
                      {p.variants.map((v) => (
                        <tr key={v.id} className="border-t border-bark/5">
                          <td className="py-1.5 pe-3 font-medium text-bark/80">{v.label || "—"}</td>
                          <td className="py-1.5 pe-3 text-bark/70">
                            {v.price !== null ? formatPrice(v.price) : a.list.noPrice[lang]}
                            {v.wasPrice !== null && (
                              <del className="ms-1 font-normal text-bark/45">{formatPrice(v.wasPrice)}</del>
                            )}
                          </td>
                          <td className="py-1.5">
                            <StockEditor
                              variant={v}
                              onSave={(raw) => run(() => setStockAction(v.id, raw), "stockSaved")}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-bark/5 pt-3 text-sm">
                <button
                  type="button"
                  onClick={() => run(() => setVisibleAction(p.id, !p.visible))}
                  className="rounded-full border border-bark/15 px-3 py-1.5 font-semibold text-bark hover:border-honey"
                >
                  {p.visible ? a.list.hide[lang] : a.list.show[lang]}
                </button>
                <Link
                  href={`/admin/products/${encodeURIComponent(p.id)}`}
                  className="rounded-full border border-bark/15 px-3 py-1.5 font-semibold text-bark hover:border-honey"
                >
                  {a.list.edit[lang]}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`${pickText(p.name, lang)}\n\n${a.list.confirmDelete[lang]}`)) {
                      run(() => deleteProductAction(p.id), "deleted");
                    }
                  }}
                  className="rounded-full border border-red-200 px-3 py-1.5 font-semibold text-red-700 hover:bg-red-50"
                >
                  {a.list.delete[lang]}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StockEditor({ variant, onSave }: { variant: Variant; onSave: (raw: string) => void }) {
  const { lang } = useLang();
  const initial = variant.stock === null ? "" : String(variant.stock);
  const [value, setValue] = useState(initial);
  const dirty = value.trim() !== initial;
  const out = isOutOfStock(variant);
  const low = variant.stock !== null && variant.stock > 0 && variant.stock <= LOW_STOCK;

  return (
    <form
      className="flex items-center gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        if (dirty) onSave(value.trim());
      }}
    >
      <input
        type="text"
        inputMode="numeric"
        pattern="\d{0,7}"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={a.list.untracked[lang]}
        aria-label={`${a.list.stock[lang]} ${variant.label}`}
        dir="ltr"
        className={`w-24 rounded-lg border px-2 py-1 text-sm outline-none focus:border-honey ${
          out ? "border-red-300 bg-red-50" : low ? "border-amber/50 bg-honey/10" : "border-bark/15"
        }`}
      />
      {dirty && (
        <button type="submit" className="rounded-lg bg-amber px-2 py-1 text-xs font-semibold text-white">
          {a.list.saveStock[lang]}
        </button>
      )}
    </form>
  );
}
