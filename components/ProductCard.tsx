"use client";

import { useState } from "react";
import { CURRENCY } from "@/lib/data";
import type { CatalogEntry } from "@/lib/catalog";
import { useLang } from "@/components/LanguageProvider";
import { useCart } from "@/components/CartProvider";
import { t } from "@/lib/translations";
import { Bag, type IconName } from "@/components/icons";
import { ProductMedia, WeightPicker } from "@/components/ProductMedia";
import { ProductDialog } from "@/components/ProductDialog";

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
  const [viewing, setViewing] = useState(false);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-bark/10 bg-white/70 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-honey/40">
      <button
        type="button"
        onClick={() => setViewing(true)}
        aria-label={`${t.shop.view[lang]}: ${product.name[lang]}`}
        className="relative block h-44 cursor-zoom-in overflow-hidden"
      >
        <ProductMedia product={product} icon={icon} className="h-full w-full" />
        <span className="absolute bottom-3 start-3 rounded-full bg-bark-deep/70 px-2.5 py-0.5 text-[11px] font-medium text-cream backdrop-blur">
          {product.origin[lang]}
        </span>
        <span className="absolute top-3 end-3 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-bark opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          {t.shop.view[lang]}
        </span>
      </button>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-lg font-semibold text-bark-deep">
          <button
            type="button"
            onClick={() => setViewing(true)}
            className="text-start hover:text-amber"
          >
            {product.name[lang]}
          </button>
        </h3>
        <p className="flex-1 text-sm leading-relaxed text-bark/70">
          {product.desc[lang]}
        </p>

        {variants && (
          <div className="mt-1">
            <WeightPicker
              variants={variants}
              value={variant}
              onChange={setVariant}
              label={t.shop.weight[lang]}
            />
          </div>
        )}

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-amber">
            {typeof product.price === "number"
              ? `${CURRENCY[lang]}${product.price}`
              : t.cart.priceOnRequest[lang]}
          </span>
          <button
            type="button"
            onClick={() => add(product.id, variant)}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-honey to-amber px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
          >
            <Bag className="h-4 w-4" stroke="currentColor" />
            {t.cart.add[lang]}
          </button>
        </div>
      </div>

      {viewing && (
        <ProductDialog
          entry={entry}
          icon={icon}
          variant={variant}
          onVariantChange={setVariant}
          onClose={() => setViewing(false)}
          onAdd={() => {
            // Close the product view first so the cart drawer is visible.
            setViewing(false);
            add(product.id, variant);
          }}
        />
      )}
    </article>
  );
}
