"use client";

import { useEffect, useMemo, useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import { SectionHeading } from "@/components/SectionHeading";
import { ProductRow } from "@/components/ProductRow";
import { useCatalog } from "@/components/CatalogProvider";
import { CATEGORIES, type CatalogProduct, type CategoryId } from "@/lib/catalog-types";
import { t } from "@/lib/translations";


type Filter = "all" | CategoryId;

/** Lower-case and fold Arabic diacritics/letter variants so search is forgiving. */
function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .trim();
}


/** Products per swipeable row. */
const ROW_SIZE = 4;
const CATEGORY_ICON: Record<CategoryId, string> = { honey: "🍯", health: "🐝", equipment: "🧰" };

const isCategory = (s: string): s is CategoryId =>
  (CATEGORIES as string[]).includes(s);

export function Shop() {
  const { lang } = useLang();
  const { products } = useCatalog();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  // Nav links (#honey, #health, #equipment) select the matching tab.
  useEffect(() => {
    const sync = () => {
      const h = window.location.hash.slice(1);
      if (isCategory(h)) {
        setFilter(h);
        setQuery("");
      }
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  // Search index: both languages, name + origin + description.
  const index = useMemo(
    () =>
      products.map((p) => ({
        p,
        text: normalize(
          (["en", "ar"] as const)
            .flatMap((l) => [p.name[l], p.origin[l], p.desc[l]])
            .join(" "),
        ),
      })),
    [products],
  );

  const results = useMemo(() => {
    const q = normalize(query.slice(0, 60));
    return index
      .filter(({ p, text }) => (filter === "all" || p.category === filter) && (!q || text.includes(q)))
      .map(({ p }) => p);
  }, [index, filter, query]);

  const tabs: { id: Filter; label: string }[] = [
    { id: "all", label: t.shop.all[lang] },
    ...CATEGORIES.map((c) => ({ id: c, label: t.nav[c][lang] })),
  ];

  return (
    <section id="shop" className="relative bg-cream py-20 sm:py-24">
      {/* Anchor targets for the nav links; offset for the fixed header. */}
      {CATEGORIES.map((c) => (
        <span key={c} id={c} className="absolute top-0 scroll-mt-16" />
      ))}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={t.shop.eyebrow[lang]}
          title={t.shop.title[lang]}
          subtitle={t.shop.subtitle[lang]}
        />

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div role="tablist" className="flex flex-wrap justify-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={filter === tab.id}
                onClick={() => setFilter(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  filter === tab.id
                    ? "bg-gradient-to-br from-honey to-amber text-white shadow"
                    : "border border-bark/15 bg-white/70 text-bark/80 hover:border-honey hover:text-amber"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-bark/40"
              fill="none"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" />
              <path d="m16 16 4 4" stroke="currentColor" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={query}
              maxLength={60}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.shop.search[lang]}
              aria-label={t.shop.search[lang]}
              className="w-full rounded-full border border-bark/15 bg-white/80 py-2.5 ps-10 pe-4 text-sm text-bark outline-none transition-colors focus:border-honey focus:ring-2 focus:ring-honey/30"
            />
          </div>
        </div>

        <p className="mt-6 text-sm text-bark/60" aria-live="polite">
          {results.length} {t.shop.results[lang]}
        </p>

        {results.length === 0 ? (
          <p className="mt-10 text-center text-bark/60">{t.shop.noResults[lang]}</p>
        ) : (
          // One block per category; each block in rows ("carousels") of up to 4.
          <div className="mt-4 space-y-10">
            {CATEGORIES.map((c) => {
              const items = results.filter((p) => p.category === c);
              if (items.length === 0) return null;
              const rows: CatalogProduct[][] = [];
              for (let i = 0; i < items.length; i += ROW_SIZE) rows.push(items.slice(i, i + ROW_SIZE));
              return (
                <div key={c}>
                  <h3 className="mb-3 flex items-baseline gap-2 font-display text-xl font-bold text-bark-deep">
                    {CATEGORY_ICON[c]} {t.nav[c][lang]}
                    <span className="text-sm font-normal text-bark/50">({items.length})</span>
                    <span className="ms-auto text-xs font-normal text-bark/45 sm:hidden">{t.shop.swipe[lang]} ↔</span>
                  </h3>
                  <div className="space-y-4">
                    {rows.map((row, i) => (
                      <ProductRow
                        key={i}
                        products={row}
                        label={t.shop.rowOf[lang]
                          .replace("{c}", t.nav[c][lang])
                          .replace("{i}", String(i + 1))
                          .replace("{n}", String(rows.length))}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
