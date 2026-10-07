"use client";

import { useActionState } from "react";
import { useLang } from "@/components/LanguageProvider";
import { SectionHeading } from "@/components/SectionHeading";
import { subscribeAction, type SubscribeState } from "@/app/offers/actions";
import { t } from "@/lib/translations";

export function Subscribe() {
  const { lang } = useLang();
  const [state, action, pending] = useActionState<SubscribeState, FormData>(subscribeAction, {});
  const o = t.offers;
  const errorText = state.error
    ? (state.error === "consent" ? o.consent_error : o[state.error])[lang]
    : null;

  const field =
    "mt-1.5 w-full rounded-xl border border-bark/15 bg-white px-4 py-2.5 text-sm text-bark outline-none focus:border-honey focus:ring-2 focus:ring-honey/30";

  return (
    <section id="offers" className="bg-cream py-20 sm:py-24">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <SectionHeading eyebrow={o.eyebrow[lang]} title={o.title[lang]} subtitle={o.subtitle[lang]} />

        {state.done ? (
          <p
            role="status"
            className="mt-10 rounded-2xl bg-leaf/15 px-5 py-4 text-center font-semibold text-leaf"
          >
            {o[state.done][lang]}
          </p>
        ) : (
          <form
            action={action}
            className="mt-10 space-y-4 rounded-3xl border border-bark/10 bg-white/80 p-6 shadow-lg sm:p-8"
          >
            <input type="hidden" name="lang" value={lang} />
            {/* Honeypot: hidden from people, often filled by spam bots. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>
                Website
                <input type="text" name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-bark">
                {o.email[lang]}
                <input name="email" type="email" maxLength={254} autoComplete="email" dir="ltr" className={field} />
              </label>
              <label className="block text-sm font-medium text-bark">
                {o.whatsapp[lang]}
                <input
                  name="whatsapp"
                  type="tel"
                  maxLength={25}
                  autoComplete="tel"
                  dir="ltr"
                  placeholder="+961 …"
                  className={field}
                />
              </label>
            </div>
            <p className="text-xs text-bark/60">
              {o.oneOf[lang]} · {o.whatsappHint[lang]}
            </p>

            <label className="flex items-start gap-3 text-sm text-bark">
              <input type="checkbox" name="consent" required className="mt-0.5 h-5 w-5 shrink-0 accent-amber" />
              {o.consent[lang]}
            </label>

            {errorText && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
                {errorText}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-gradient-to-br from-honey to-amber py-3 text-sm font-semibold text-white shadow-lg shadow-honey/30 transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              {o.submit[lang]}
            </button>
            <p className="text-center text-xs text-bark/55">{o.privacy[lang]}</p>
          </form>
        )}
      </div>
    </section>
  );
}
