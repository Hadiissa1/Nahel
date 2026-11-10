"use client";

import Link from "next/link";
import { useCatalog } from "@/components/CatalogProvider";
import { useLang } from "@/components/LanguageProvider";
import { SectionHeading } from "@/components/SectionHeading";
import { t } from "@/lib/translations";
import { CATEGORIES, type CategoryId } from "@/lib/catalog-types";

const STYLE: Record<CategoryId, { icon: string; bg: string }> = {
  honey: { icon: "🍯", bg: "from-honey-light via-honey to-amber" },
  equipment: { icon: "🧰", bg: "from-bark to-bark-deep" },
  health: { icon: "🐝", bg: "from-leaf to-[#4d6133]" },
};

/** Home page doors: the three product shelves, then the information pages. */
export function HomeExplore() {
  const { lang } = useLang();
  const { products } = useCatalog();
  const e = t.explore;
  const digits = (n: number) => (lang === "ar" ? String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]) : String(n));

  return (
    <section className="bg-cream py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow={e.eyebrow[lang]} title={e.title[lang]} subtitle={e.subtitle[lang]} />

        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {CATEGORIES.map((c) => {
            const count = products.filter((p) => p.category === c).length;
            return (
              <li key={c}>
                {/* A plain link: the hash selects the tab when the shop page opens. */}
                <a
                  href={`/shop#${c}`}
                  className={`group relative flex h-full min-h-56 flex-col justify-end overflow-hidden rounded-3xl bg-gradient-to-br p-7 text-white shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${STYLE[c].bg}`}
                >
                  <span className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle,#fff_1px,transparent_1.5px)] [background-size:20px_20px]" />
                  <span
                    aria-hidden="true"
                    className="absolute -top-2 end-4 text-8xl opacity-90 drop-shadow-lg transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110 motion-reduce:transition-none"
                  >
                    {STYLE[c].icon}
                  </span>
                  <span className="relative text-xs font-semibold uppercase tracking-wider text-white/80">
                    {e.count[lang].replace("{n}", digits(count))}
                  </span>
                  <span className="font-display relative mt-1 text-2xl font-bold">{t.nav[c][lang]}</span>
                  <span className="relative mt-2 text-sm leading-relaxed text-white/85">{e.categories[c][lang]}</span>
                  <span className="relative mt-4 inline-flex items-center gap-2 text-sm font-semibold">
                    {e.open[lang]}
                    <span aria-hidden="true" className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1">→</span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>

        <h3 className="font-display mt-16 text-center text-xl font-bold text-bark-deep">{e.moreTitle[lang]}</h3>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {e.more.map((m) => (
            <li key={m.href}>
              <Link
                href={m.href}
                className="group flex h-full items-start gap-4 rounded-2xl border border-bark/10 bg-white/80 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-honey/50 hover:shadow-lg"
              >
                <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-honey/15 text-2xl transition-transform group-hover:scale-110 motion-reduce:transition-none">
                  {m.icon}
                </span>
                <span>
                  <span className="font-display block font-semibold text-bark-deep group-hover:text-amber">{m.title[lang]}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-bark/65">{m.text[lang]}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
