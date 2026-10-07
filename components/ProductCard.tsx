"use client";

import { useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import { useCart } from "@/components/CartProvider";
import { t } from "@/lib/translations";
import { Bag } from "@/components/icons";
import { OptionPicker, ProductMedia, defaultOption } from "@/components/ProductMedia";
import { ProductDialog } from "@/components/ProductDialog";
import { StockAndPrice } from "@/components/StockAndPrice";
import { SaleBadge } from "@/components/SaleBadge";
import { isOutOfStock, pickText, type CatalogProduct } from "@/lib/catalog-types";

export function ProductCard({ product }: { product: CatalogProduct }) {
  const { lang } = useLang();
  const { add } = useCart();
  const [optionId, setOptionId] = useState(defaultOption(product.variants));
  const [viewing, setViewing] = useState(false);
  const option = product.variants.find((v) => v.id === optionId);
  const soldOut = !option || isOutOfStock(option);
  const name = pickText(product.name, lang);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-bark/10 bg-white/70 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-honey/40">
      <button
        type="button"
        onClick={() => setViewing(true)}
        aria-label={`${t.shop.view[lang]}: ${name}`}
        className="relative block h-44 cursor-zoom-in overflow-hidden"
      >
        <ProductMedia product={product} className="h-full w-full" />
        <SaleBadge variants={product.variants} className="absolute top-3 start-3" />
        {pickText(product.origin, lang) && (
          <span className="absolute bottom-3 start-3 rounded-full bg-bark-deep/70 px-2.5 py-0.5 text-[11px] font-medium text-cream backdrop-blur">
            {pickText(product.origin, lang)}
          </span>
        )}
        <span className="absolute top-3 end-3 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-bark opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          {t.shop.view[lang]}
        </span>
      </button>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-lg font-semibold text-bark-deep">
          <button type="button" onClick={() => setViewing(true)} className="text-start hover:text-amber">
            {name}
          </button>
        </h3>
        <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-bark/70">
          {pickText(product.desc, lang)}
        </p>

        {product.variants.length > 1 && (
          <div className="mt-1">
            <OptionPicker
              variants={product.variants}
              value={optionId}
              onChange={setOptionId}
              label={t.shop.weight[lang]}
            />
          </div>
        )}

        <div className="mt-2 flex items-center justify-between gap-2">
          <StockAndPrice option={option} />
          <button
            type="button"
            disabled={soldOut}
            onClick={() => optionId && add(product.id, optionId)}
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-br from-honey to-amber px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-transform hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
          >
            <Bag className="h-4 w-4" stroke="currentColor" />
            {t.cart.add[lang]}
          </button>
        </div>
      </div>

      {viewing && (
        <ProductDialog
          product={product}
          optionId={optionId}
          onOptionChange={setOptionId}
          onClose={() => setViewing(false)}
          onAdd={() => {
            // Close the product view first so the cart drawer is visible.
            setViewing(false);
            if (optionId) add(product.id, optionId);
          }}
        />
      )}
    </article>
  );
}
