"use client";

import Link from "next/link";
import { useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import { useCart } from "@/components/CartProvider";
import { Bag } from "@/components/icons";
import { OptionPicker, ProductMedia, defaultOption } from "@/components/ProductMedia";
import { StockAndPrice } from "@/components/StockAndPrice";
import { NotifyMe } from "@/components/NotifyMe";
import { ShareButtons } from "@/components/ShareButtons";
import { SaleBadge } from "@/components/SaleBadge";
import { ProductCard } from "@/components/ProductCard";
import { t } from "@/lib/translations";
import { isOutOfStock, pickText, type CatalogProduct } from "@/lib/catalog-types";

export function ProductDetail({
  product,
  related,
}: {
  product: CatalogProduct;
  related: CatalogProduct[];
}) {
  const { lang } = useLang();
  const { add } = useCart();
  const [optionId, setOptionId] = useState(defaultOption(product.variants));
  const option = product.variants.find((v) => v.id === optionId);
  const soldOut = !option || isOutOfStock(option);
  const s = t.shop;

  return (
    <main className="flex-1 bg-cream pt-24 pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-bark/60">
          <Link href="/" className="hover:text-amber">
            {s.backToShop[lang]}
          </Link>
          <span className="mx-2">›</span>
          <Link href={`/#${product.category}`} className="hover:text-amber">
            {t.nav[product.category][lang]}
          </Link>
        </nav>

        <article className="mt-5 grid overflow-hidden rounded-3xl border border-bark/10 bg-white shadow-sm md:grid-cols-2">
          <ProductMedia
            product={product}
            size="lg"
            fit="contain"
            className="aspect-square w-full md:aspect-auto md:min-h-[30rem]"
          />

          <div className="flex flex-col gap-4 p-6 sm:p-8">
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <SaleBadge variants={product.variants} className="py-1" />
              <span className="rounded-full bg-honey/15 px-3 py-1 text-amber">
                {t.nav[product.category][lang]}
              </span>
              {pickText(product.origin, lang) && (
                <span className="rounded-full bg-bark/10 px-3 py-1 text-bark/80">
                  {pickText(product.origin, lang)}
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl font-bold text-bark-deep sm:text-4xl">
              {pickText(product.name, lang)}
            </h1>
            <p className="whitespace-pre-line leading-relaxed text-bark/75">
              {pickText(product.desc, lang)}
            </p>

            {product.variants.length > 1 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-bark">{s.weight[lang]}</p>
                <OptionPicker
                  outLabel={t.shop.outOfStock[lang]}
                  variants={product.variants}
                  value={optionId}
                  onChange={setOptionId}
                  label={s.weight[lang]}
                  size="md"
                />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-bark/10 pt-5">
              <StockAndPrice option={option} large />
              <button
                type="button"
                disabled={soldOut}
                onClick={() => optionId && add(product.id, optionId)}
                className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-br from-honey to-amber px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-honey/30 transition-transform hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
              >
                <Bag className="h-5 w-5" stroke="currentColor" />
                {t.cart.add[lang]}
              </button>
            </div>
            {soldOut && option && (
              <NotifyMe key={option.id} productId={product.id} variantId={option.id} />
            )}

            <div className="border-t border-bark/10 pt-4">
              <ShareButtons product={product} />
            </div>
          </div>
        </article>

        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-2xl font-bold text-bark-deep">{s.related[lang]}</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
