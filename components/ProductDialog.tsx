"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useLang } from "@/components/LanguageProvider";
import { t } from "@/lib/translations";
import { Bag, Close } from "@/components/icons";
import { OptionPicker, ProductMedia } from "@/components/ProductMedia";
import { StockAndPrice } from "@/components/StockAndPrice";
import { NotifyMe } from "@/components/NotifyMe";
import { ShareButtons } from "@/components/ShareButtons";
import { isOutOfStock, pickText, type CatalogProduct } from "@/lib/catalog-types";

/**
 * Large product view. Uses the native <dialog> in modal mode, which traps
 * focus, closes on Escape and restores focus to the opener on close.
 */
export function ProductDialog({
  product,
  optionId,
  onOptionChange,
  onAdd,
  onClose,
}: {
  product: CatalogProduct;
  optionId?: string;
  onOptionChange: (id: string) => void;
  onAdd: () => void;
  onClose: () => void;
}) {
  const { lang } = useLang();
  const ref = useRef<HTMLDialogElement>(null);
  const { variants, category } = product;
  const option = variants.find((v) => v.id === optionId);
  const soldOut = !option || isOutOfStock(option);

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      dialog?.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // A click on the dialog element itself is a click on the backdrop.
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      aria-labelledby={`pd-${product.id}`}
      className="m-auto w-[calc(100%-2rem)] max-w-4xl overflow-hidden rounded-3xl bg-cream p-0 text-start text-foreground shadow-2xl backdrop:bg-bark-deep/60 backdrop:backdrop-blur-sm"
    >
      <button
        type="button"
        onClick={() => ref.current?.close()}
        aria-label={t.shop.close[lang]}
        className="absolute top-4 end-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-bark/70 shadow-sm transition-colors hover:text-bark"
      >
        <Close className="h-5 w-5" stroke="currentColor" />
      </button>

      <div className="grid max-h-[90dvh] overflow-y-auto md:grid-cols-2">
        <ProductMedia
          product={product}
          size="lg"
          fit="contain"
          className="aspect-square w-full md:aspect-auto md:min-h-[28rem]"
        />

        <div className="flex flex-col gap-4 p-6 sm:p-8">
          <div className="flex flex-wrap gap-2 text-xs font-semibold md:pe-10">
            <span className="rounded-full bg-honey/15 px-3 py-1 text-amber">
              {t.nav[category][lang]}
            </span>
            {pickText(product.origin, lang) && (
              <span className="rounded-full bg-bark/10 px-3 py-1 text-bark/80">
                {pickText(product.origin, lang)}
              </span>
            )}
          </div>

          <h2
            id={`pd-${product.id}`}
            className="font-display text-2xl font-bold text-bark-deep sm:text-3xl"
          >
            {pickText(product.name, lang)}
          </h2>

          <p className="whitespace-pre-line leading-relaxed text-bark/75">{pickText(product.desc, lang)}</p>

          {variants.length > 1 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-bark">
                {t.shop.weight[lang]}
              </p>
              <OptionPicker
                outLabel={t.shop.outOfStock[lang]}
                variants={variants}
                value={optionId}
                onChange={onOptionChange}
                label={t.shop.weight[lang]}
                size="md"
              />
            </div>
          )}

          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-bark/10 pt-5">
            <StockAndPrice option={option} large />
            <button
              type="button"
              onClick={onAdd}
              disabled={soldOut}
              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-br from-honey to-amber px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-honey/30 transition-transform hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
            >
              <Bag className="h-5 w-5" stroke="currentColor" />
              {t.cart.add[lang]}
            </button>
          </div>
          {soldOut && option && (
            <NotifyMe key={option.id} productId={product.id} variantId={option.id} />
          )}

          <div className="flex flex-col gap-3 border-t border-bark/10 pt-4">
            <ShareButtons product={product} />
            <Link
              href={`/product/${encodeURIComponent(product.id)}`}
              className="text-sm font-semibold text-amber hover:text-bark"
            >
              {t.shop.fullPage[lang]} →
            </Link>
          </div>
        </div>
      </div>
    </dialog>
  );
}
