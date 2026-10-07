"use client";

import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";
import { LotFacts } from "@/components/LotDetails";
import { ProductMedia } from "@/components/ProductMedia";
import { t } from "@/lib/translations";
import { pickText, type CatalogProduct } from "@/lib/catalog-types";
import type { Lot } from "@/lib/lot-types";

export function LotResult({ code, lot, product }: { code: string; lot: Lot | null; product?: CatalogProduct }) {
  const { lang } = useLang();
  const l = t.lots;
  if (!lot || !product) {
    return (
      <p role="alert" className="rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-700">
        {l.notFound[lang].replace("{c}", code)}
      </p>
    );
  }
  return (
    <article className="overflow-hidden rounded-3xl border border-bark/10 bg-white shadow-sm">
      <div className="flex items-center gap-2 bg-leaf/10 px-5 py-3 text-sm font-semibold text-leaf">
        ✓ {l.authentic[lang]} · <span className="font-mono" dir="ltr">{lot.code}</span>
      </div>
      <div className="grid gap-5 p-5 sm:grid-cols-[10rem_1fr]">
        <ProductMedia product={product} className="aspect-square w-full rounded-2xl" />
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-bark/50">{l.product[lang]}</p>
            <h2 className="font-display text-2xl font-bold text-bark-deep">{pickText(product.name, lang)}</h2>
          </div>
          <LotFacts lot={lot} />
          <Link href={`/product/${encodeURIComponent(product.id)}`} className="inline-block text-sm font-semibold text-amber hover:text-bark">
            {l.viewProduct[lang]} →
          </Link>
        </div>
      </div>
    </article>
  );
}
