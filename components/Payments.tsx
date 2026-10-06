"use client";

import { useLang } from "@/components/LanguageProvider";
import { t } from "@/lib/translations";
import { SectionHeading } from "@/components/SectionHeading";
import { Icon, Shield } from "@/components/icons";

export function Payments() {
  const { lang } = useLang();

  return (
    <section id="pay" className="bg-cream py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={t.payments.eyebrow[lang]}
          title={t.payments.title[lang]}
          subtitle={t.payments.subtitle[lang]}
        />

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-3">
          {t.payments.methods.map((m) => (
            <div
              key={m.icon}
              className="group flex flex-col items-center rounded-2xl border border-bark/10 bg-white/70 p-7 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-honey/40 hover:shadow-xl"
            >
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-honey to-amber text-white shadow-lg shadow-honey/30 transition-transform duration-300 group-hover:scale-110">
                <Icon name={m.icon} className="h-8 w-8" stroke="currentColor" />
              </span>
              <h3 className="font-display mt-5 text-xl font-semibold text-bark-deep">
                {m.name[lang]}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-bark/70">
                {m.desc[lang]}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-8 flex items-center justify-center gap-2 text-sm font-medium text-bark/60">
          <Shield className="h-4 w-4 text-leaf" stroke="currentColor" />
          {t.payments.secure[lang]}
        </p>
      </div>
    </section>
  );
}
