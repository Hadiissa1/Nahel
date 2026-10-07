"use client";

import { useState } from "react";
import { CURRENCY } from "@/lib/data";
import type { CatalogEntry } from "@/lib/catalog";
import { useLang } from "@/components/LanguageProvider";
import { useCart } from "@/components/CartProvider";
import { t } from "@/lib/translations";
import { Icon, Bag, type IconName } from "@/components/icons";

export function ProductCard({
  entry,
  icon,
}: {
  entry: CatalogEntry;
  icon: IconName;
}) {
  const { product, variants } = entry;
  const { lang } = useLang();
  const { add } = useCart();
  const [variant, setVariant] = useState(variants?.[1] ?? variants?.[0]);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-bark/10 bg-white/70 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-honey/40">
      <div className="relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br from-honey-light via-honey to-amber">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle,rgba(255,255,255,.9)_1px,transparent_1.4px)] [background-size:16px_16px]" />
        <Icon
          name={icon}
          className="relative h-16 w-16 text-white drop-shadow transition-transform duration-300 group-hover:scale-110"
          stroke="currentColor"
        />
        <span className="absolute bottom-3 start-3 rounded-full bg-bark-deep/70 px-2.5 py-0.5 text-[11px] font-medium text-cream backdrop-blur">
          {product.origin[lang]}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-lg font-semibold text-bark-deep">
          {product.name[lang]}
        </h3>
        <p className="flex-1 text-sm leading-relaxed text-bark/70">
          {product.desc[lang]}
        </p>

        {variants && (
          <div
            role="radiogroup"
            aria-label={t.shop.weight[lang]}
            className="mt-1 flex gap-1.5"
          >
            {variants.map((v) => (
              <button
                key={v}
                role="radio"
                aria-checked={variant === v}
                onClick={() => setVariant(v)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  variant === v
                    ? "border-amber bg-amber text-white"
                    : "border-bark/15 bg-white text-bark/70 hover:border-honey hover:text-amber"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        )}

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-amber">
            {typeof product.price === "number"
              ? `${CURRENCY[lang]}${product.price}`
              : t.cart.priceOnRequest[lang]}
          </span>
          <button
            onClick={() => add(product.id, variant)}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-honey to-amber px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
          >
            <Bag className="h-4 w-4" stroke="currentColor" />
            {t.cart.add[lang]}
          </button>
        </div>
      </div>
    </article>
  );
}
