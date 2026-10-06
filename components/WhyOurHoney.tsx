"use client";

import { useLang } from "@/components/LanguageProvider";
import { t } from "@/lib/translations";
import { Drop, Pin, Bee, Shield } from "@/components/icons";

const icons = [Drop, Pin, Bee, Shield];

export function WhyOurHoney() {
  const { lang } = useLang();

  return (
    <section id="why" className="relative overflow-hidden bg-bark-deep py-20 text-cream sm:py-24">
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle,#fff_1px,transparent_1.5px)] [background-size:22px_22px]" />
      <div className="pointer-events-none absolute -top-20 end-0 h-80 w-80 rounded-full bg-honey/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-honey/40 bg-honey/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-honey-light">
            <span className="h-1.5 w-1.5 rounded-full bg-honey-light" />
            {t.why.eyebrow[lang]}
          </span>
          <h2 className="font-display mt-4 text-3xl font-bold leading-tight sm:text-4xl">
            {t.why.title[lang]}
          </h2>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {t.why.items.map((item, i) => {
            const I = icons[i];
            return (
              <div
                key={i}
                className="rounded-2xl border border-cream/10 bg-cream/5 p-6 backdrop-blur transition-colors hover:border-honey/40 hover:bg-cream/10"
              >
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-honey to-amber text-white shadow">
                  <I className="h-6 w-6" stroke="currentColor" />
                </span>
                <h3 className="font-display mt-4 text-lg font-semibold">
                  {item.title[lang]}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-cream/70">
                  {item.desc[lang]}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
