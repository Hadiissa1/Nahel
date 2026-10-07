"use client";

import { useLang } from "@/components/LanguageProvider";
import { t } from "@/lib/translations";
import { bestDiscount, type Variant } from "@/lib/catalog-types";
import { cn } from "@/lib/utils";

/** "-20 %" ribbon for a product with a size on sale (nothing otherwise). */
export function SaleBadge({ variants, className }: { variants: Variant[]; className?: string }) {
  const { lang } = useLang();
  const pct = bestDiscount(variants);
  if (!pct) return null;
  return (
    <span
      className={cn(
        "rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm",
        className,
      )}
      aria-label={t.shop.saleBadge[lang].replace("{n}", String(pct))}
      dir="ltr"
    >
      -{pct}%
    </span>
  );
}
