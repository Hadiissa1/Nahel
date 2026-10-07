"use client";

import { SafeImage } from "@/components/SafeImage";
import { useLang } from "@/components/LanguageProvider";
import { Icon } from "@/components/icons";
import { productIcon } from "@/components/product-icons";
import { isOutOfStock, photoUrl, pickText, type CatalogProduct, type Variant } from "@/lib/catalog-types";
import { cn } from "@/lib/utils";

/**
 * The product's photo, or a honey-gradient icon tile when it has none yet.
 * `size="lg"` + `fit="contain"` show the whole photo (product view).
 */
export function ProductMedia({
  product,
  size = "sm",
  fit = "cover",
  className,
}: {
  product: CatalogProduct;
  size?: "sm" | "lg";
  fit?: "cover" | "contain";
  className?: string;
}) {
  const { lang } = useLang();
  const icon = productIcon(product.id, product.category);

  if (product.photo) {
    return (
      <SafeImage
        src={photoUrl(product.photo, size)}
        alt={pickText(product.name, lang)}
        icon={icon}
        className={cn(fit === "contain" && "bg-cream-deep", className)}
        imgClassName={cn(
          fit === "contain"
            ? "object-contain"
            : "transition-transform duration-500 group-hover:scale-105",
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "relative flex items-center justify-center bg-gradient-to-br from-honey-light via-honey to-amber",
        className,
      )}
    >
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle,rgba(255,255,255,.9)_1px,transparent_1.4px)] [background-size:16px_16px]" />
      <Icon
        name={icon}
        className="relative h-1/3 max-h-28 w-1/3 max-w-28 text-white drop-shadow transition-transform duration-300 group-hover:scale-110"
        stroke="currentColor"
      />
    </div>
  );
}

/** Size options (e.g. 250g / 500g / 1kg). Sold-out options are disabled. */
export function OptionPicker({
  variants,
  value,
  onChange,
  label,
  size = "sm",
}: {
  variants: Variant[];
  value?: string;
  onChange: (id: string) => void;
  label: string;
  size?: "sm" | "md";
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {variants.map((v) => {
        const out = isOutOfStock(v);
        return (
          <button
            key={v.id}
            type="button"
            role="radio"
            aria-checked={value === v.id}
            disabled={out}
            onClick={() => onChange(v.id)}
            className={cn(
              "rounded-full border font-semibold transition-colors disabled:cursor-not-allowed disabled:line-through disabled:opacity-40",
              size === "md" ? "px-4 py-1.5 text-sm" : "px-3 py-1 text-xs",
              value === v.id
                ? "border-amber bg-amber text-white"
                : "border-bark/15 bg-white text-bark/70 hover:border-honey hover:text-amber",
            )}
          >
            {v.label}
          </button>
        );
      })}
    </div>
  );
}

/** Default option: the first one still in stock. */
export function defaultOption(variants: Variant[]) {
  return (variants.find((v) => !isOutOfStock(v)) ?? variants[0])?.id;
}
