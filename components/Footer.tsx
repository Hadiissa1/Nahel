"use client";

import { useLang } from "@/components/LanguageProvider";
import { t } from "@/lib/translations";

const YEAR = new Date().getFullYear();

export function Footer() {
  const { lang } = useLang();

  const nav = [
    { id: "honey", key: "honey" as const },
    { id: "equipment", key: "equipment" as const },
    { id: "health", key: "health" as const },
    { id: "why", key: "why" as const },
    { id: "pay", key: "pay" as const },
    { id: "faq", key: "faq" as const },
    { id: "offers", key: "offers" as const },
    { id: "contact", key: "contact" as const },
  ];

  return (
    <footer className="bg-bark-deep text-cream/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-honey to-amber text-white">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" strokeWidth={1.7}>
                <path
                  d="M12 4c3 3.5 5 6 5 8.2A5 5 0 0 1 7 12.2C7 10 9 7.5 12 4Z"
                  stroke="currentColor"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="font-display text-xl font-bold text-cream">
              {t.brand[lang]}
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/60">
            {t.footer.about[lang]}
          </p>
        </div>

        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-honey-light">
            {t.footer.quickLinks[lang]}
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {nav.map((l) => (
              <li key={l.id}>
                <a
                  href={`/#${l.id}`}
                  className="text-cream/70 transition-colors hover:text-honey-light"
                >
                  {t.nav[l.key][lang]}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-honey-light">
            {t.footer.follow[lang]}
          </h3>
          <div className="mt-4 flex gap-3">
            {["WhatsApp", "Instagram", "Facebook"].map((s) => (
              <a
                key={s}
                href="#"
                aria-label={s}
                className="grid h-10 w-10 place-items-center rounded-full border border-cream/15 text-cream/70 transition-colors hover:border-honey hover:text-honey-light"
              >
                <span className="text-xs font-semibold">{s.charAt(0)}</span>
              </a>
            ))}
          </div>
          <p className="mt-5 text-sm text-cream/60">{t.contact.address[lang]}</p>
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="mx-auto max-w-7xl px-4 py-5 text-center text-xs text-cream/50 sm:px-6 lg:px-8">
          © {YEAR} {t.brand[lang]}. {t.footer.rights[lang]}
        </div>
      </div>
    </footer>
  );
}
