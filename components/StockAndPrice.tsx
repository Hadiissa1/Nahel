"use client";

import { useLang } from "@/components/LanguageProvider";
import { t } from "@/lib/translations";
import { LOW_STOCK, formatPrice, isOutOfStock, type Variant } from "@/lib/catalog-types";

/** Price of the selected option plus a stock hint ("Only 3 left" / "Out of stock"). */
export function StockAndPrice({ option, large }: { option?: Variant; large?: boolean }) {
  const { lang } = useLang();
  const low = option && option.stock !== null && option.stock > 0 && option.stock <= LOW_STOCK;
  return (
    <span className="flex flex-col">
      <span className={`whitespace-nowrap font-semibold text-amber ${large ? "text-lg" : "text-sm"}`}>
        {option?.price != null ? formatPrice(option.price) : t.cart.priceOnRequest[lang]}
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
