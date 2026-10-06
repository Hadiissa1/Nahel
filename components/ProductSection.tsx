"use client";

import type { Product, LocalizedText } from "@/lib/data";
import { useLang } from "@/components/LanguageProvider";
import { SectionHeading } from "@/components/SectionHeading";
import { ProductCard } from "@/components/ProductCard";
import type { IconName } from "@/components/icons";

export function ProductSection({
  id,
  eyebrow,
  title,
  subtitle,
  products,
  icons,
  tone = "cream",
}: {
  id: string;
  eyebrow: LocalizedText;
  title: LocalizedText;
  subtitle: LocalizedText;
  products: Product[];
  icons: Record<string, IconName>;
  tone?: "cream" | "white";
}) {
  const { lang } = useLang();

  return (
    <section
      id={id}
      className={`py-20 sm:py-24 ${
        tone === "cream" ? "bg-cream-deep/40" : "bg-cream"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={eyebrow[lang]}
          title={title[lang]}
          subtitle={subtitle[lang]}
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              category={title}
              icon={icons[p.id] ?? "Drop"}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
