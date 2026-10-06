"use client";

import { useLang } from "@/components/LanguageProvider";
import { t } from "@/lib/translations";
import { SectionHeading } from "@/components/SectionHeading";
import { Quote } from "@/components/icons";

export function Testimonials() {
  const { lang } = useLang();

  return (
    <section className="bg-cream py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={t.testimonials.eyebrow[lang]}
          title={t.testimonials.title[lang]}
        />

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {t.testimonials.items.map((item, i) => (
            <figure
              key={i}
              className="flex flex-col rounded-2xl border border-bark/10 bg-white/70 p-6 shadow-sm transition-shadow hover:shadow-lg"
            >
              <Quote className="h-8 w-8 text-honey/60" />
              <blockquote className="mt-3 flex-1 text-[15px] leading-relaxed text-bark/80">
                “{item.quote[lang]}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-bark/10 pt-4">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-honey to-amber font-display text-sm font-bold text-white">
                  {item.name[lang].charAt(0)}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-bark-deep">
                    {item.name[lang]}
                  </span>
                  <span className="block text-xs text-bark/60">
                    {item.role[lang]}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
