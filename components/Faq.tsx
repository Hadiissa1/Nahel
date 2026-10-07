"use client";

import { useLang } from "@/components/LanguageProvider";
import { SectionHeading } from "@/components/SectionHeading";
import { t } from "@/lib/translations";

export function Faq() {
  const { lang } = useLang();

  return (
    <section id="faq" className="bg-cream-deep/40 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow={t.faq.eyebrow[lang]} title={t.faq.title[lang]} />

        <div className="mt-10 space-y-3">
          {t.faq.items.map((item, i) => (
            <details
              key={i}
              className="group rounded-2xl border border-bark/10 bg-white/70 px-5 py-4 open:shadow-md"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-bark-deep">
                {item.q[lang]}
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-honey/15 text-amber transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-bark/70">{item.a[lang]}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
