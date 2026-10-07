"use client";

import type { Product } from "@/lib/data";
import { PRODUCT_PHOTOS } from "@/lib/photos";
import { SafeImage } from "@/components/SafeImage";
import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * The product's photo, or a honey-gradient icon tile when no verified photo
 * exists yet. `fit="contain"` shows the whole photo (used in the product view).
 */
export function ProductMedia({
  product,
  icon,
  fit = "cover",
  className,
}: {
  product: Product;
  icon: IconName;
  fit?: "cover" | "contain";
  className?: string;
}) {
  const photo = PRODUCT_PHOTOS[product.id];

  if (photo) {
    return (
      <SafeImage
        src={photo.src}
        alt={photo.alt}
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

/** Weight options for honey (250g / 500g / 1kg). */
export function WeightPicker({
  variants,
  value,
  onChange,
  label,
  size = "sm",
}: {
  variants: readonly string[];
  value?: string;
  onChange: (v: string) => void;
  label: string;
  size?: "sm" | "md";
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1.5">
      {variants.map((v) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={cn(
            "rounded-full border font-semibold transition-colors",
            size === "md" ? "px-4 py-1.5 text-sm" : "px-3 py-1 text-xs",
            value === v
              ? "border-amber bg-amber text-white"
              : "border-bark/15 bg-white text-bark/70 hover:border-honey hover:text-amber",
          )}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
