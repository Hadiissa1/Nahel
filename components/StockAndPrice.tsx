"use client";

import { useLang } from "@/components/LanguageProvider";
import { t } from "@/lib/translations";
import {
  LOW_STOCK,
  discountPercent,
  formatPrice,
  isOutOfStock,
  type Variant,
} from "@/lib/catalog-types";

/** Price of the selected option plus a stock hint ("Only 3 left" / "Out of stock"). */
export function StockAndPrice({ option, large }: { option?: Variant; large?: boolean }) {
  const { lang } = useLang();
  const low = option && option.stock !== null && option.stock > 0 && option.stock <= LOW_STOCK;
  return (
    <span className="flex flex-col">
      <span className={`whitespace-nowrap font-semibold text-amber ${large ? "text-lg" : "text-sm"}`}>
        {option?.price != null ? formatPrice(option.price) : t.cart.priceOnRequest[lang]}
        {option && discountPercent(option) > 0 && (
          <>
            {" "}
            <del className={`font-normal text-bark/50 ${large ? "text-sm" : "text-xs"}`}>
              <span className="sr-only">{t.shop.wasPrice[lang]} </span>
              {formatPrice(option.wasPrice!)}
            </del>
          </>
        )}
      </span>
      {option && isOutOfStock(option) && (
        <span className="text-xs font-semibold text-red-700">{t.shop.outOfStock[lang]}</span>
      )}
      {low && (
        <span className="text-xs font-semibold text-bark/70">
          {t.shop.onlyLeft[lang].replace("{n}", String(option!.stock))}
        </span>
      )}
    </span>
  );
}
