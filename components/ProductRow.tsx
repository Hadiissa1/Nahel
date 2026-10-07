"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import { ProductCard } from "@/components/ProductCard";
import { t } from "@/lib/translations";
import type { CatalogProduct } from "@/lib/catalog-types";

/**
 * A swipeable row of up to 4 products. On phones one card shows with the
 * next one peeking (swipe left/right); on large screens all 4 fit. Arrow
 * buttons appear on tablets and computers when the row can scroll.
 */
export function ProductRow({ products, label }: { products: CatalogProduct[]; label: string }) {
  const { lang } = useLang();
  const ref = useRef<HTMLUListElement>(null);
  const [canBack, setCanBack] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // In right-to-left pages scrollLeft runs from 0 down to negative values.
    const pos = Math.abs(el.scrollLeft);
    setCanBack(pos > 4);
    setCanNext(pos + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    el.scrollBy({ left: dir * (rtl ? -1 : 1) * el.clientWidth * 0.85, behavior: "smooth" });
  };

  const arrow = "absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-bark/15 bg-white/95 text-bark shadow-md transition-opacity hover:border-honey hover:text-amber sm:grid";

  return (
    <div className="relative">
      <ul
        ref={ref}
        onScroll={update}
        aria-label={label}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto scroll-smooth px-4 pb-3 [scrollbar-width:none] sm:mx-0 sm:scroll-px-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p) => (
          <li key={p.id} className="flex w-[78%] shrink-0 snap-start sm:w-[45%] md:w-[31%] lg:w-[calc((100%-3rem)/4)]">
            <div className="flex w-full [&>article]:w-full">
              <ProductCard product={p} />
            </div>
          </li>
        ))}
      </ul>
      {canBack && (
        <button type="button" onClick={() => scroll(-1)} aria-label={t.shop.previous[lang]} className={`${arrow} -start-3`}>
          <span aria-hidden="true" className="rtl:rotate-180">‹</span>
        </button>
      )}
      {canNext && (
        <button type="button" onClick={() => scroll(1)} aria-label={t.shop.next[lang]} className={`${arrow} -end-3`}>
          <span aria-hidden="true" className="rtl:rotate-180">›</span>
        </button>
      )}
    </div>
  );
}
