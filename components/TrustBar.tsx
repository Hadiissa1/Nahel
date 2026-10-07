"use client";

import { useLang } from "@/components/LanguageProvider";
import { t } from "@/lib/translations";
import { Bee, Drop, Wallet, Whatsapp } from "@/components/icons";

const ICONS = [Bee, Drop, Wallet, Whatsapp];

export function TrustBar() {
  const { lang } = useLang();

  return (
    <section aria-label="Why shop with us" className="border-y border-bark/10 bg-white/60">
      <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-4 lg:px-8">
        {t.trust.map((item, i) => {
          const I = ICONS[i];
          return (
            <li key={i} className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-honey/15 text-amber">
                <I className="h-5 w-5" stroke="currentColor" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-bark-deep">
                  {item.title[lang]}
                </span>
                <span className="block text-xs text-bark/60">{item.desc[lang]}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
