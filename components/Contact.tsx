"use client";

import { useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import { t } from "@/lib/translations";
import { CONTACT } from "@/lib/config";
import { Phone, Mail, Pin } from "@/components/icons";

export function Contact() {
  const { lang } = useLang();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = [
      `${t.contact.name[lang]}: ${form.name.trim()}`,
      `${t.contact.phone[lang]}: ${form.phone.trim()}`,
      "",
      form.message.trim(),
    ].join("\n");
    window.open(
      `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setSent(true);
  };

  const cards = [
    {
      Icon: Phone,
      label: t.contact.callUs[lang],
      value: CONTACT.phoneDisplay,
      href: CONTACT.phoneHref,
    },
    {
      Icon: Mail,
      label: t.contact.emailUs[lang],
      value: CONTACT.email,
      href: `mailto:${CONTACT.email}`,
    },
    {
      Icon: Pin,
      label: t.contact.visit[lang],
      value: t.contact.address[lang],
      href: undefined,
    },
  ];

  return (
    <section id="contact" className="bg-cream-deep/40 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Info */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-honey/40 bg-honey/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber">
              <span className="h-1.5 w-1.5 rounded-full bg-honey" />
              {t.contact.eyebrow[lang]}
            </span>
            <h2 className="font-display mt-4 text-3xl font-bold leading-tight text-bark-deep sm:text-4xl">
              {t.contact.title[lang]}
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-bark/70">
              {t.contact.subtitle[lang]}
            </p>

            <ul className="mt-8 space-y-4">
              {cards.map(({ Icon, label, value, href }) => {
                const inner = (
                  <>
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-honey to-amber text-white shadow">
                      <Icon className="h-5 w-5" stroke="currentColor" />
                    </span>
                    <span className="text-start">
                      <span className="block text-xs font-medium uppercase tracking-wide text-bark/50">
                        {label}
                      </span>
                      <span className="block text-sm font-semibold text-bark-deep">
                        {value}
                      </span>
                    </span>
                  </>
                );
                return (
                  <li key={label}>
                    {href ? (
                      <a
                        href={href}
                        className="flex items-center gap-4 rounded-2xl border border-bark/10 bg-white/60 p-4 transition-colors hover:border-honey/50"
                      >
                        {inner}
                      </a>
                    ) : (
                      <div className="flex items-center gap-4 rounded-2xl border border-bark/10 bg-white/60 p-4">
                        {inner}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Form */}
          <form
            onSubmit={onSubmit}
            className="rounded-3xl border border-bark/10 bg-white/80 p-6 shadow-lg sm:p-8"
          >
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-bark">
                  {t.contact.name[lang]}
                </label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  autoComplete="name"
                  value={form.name}
                  onChange={set("name")}
                  className="w-full rounded-xl border border-bark/15 bg-cream/40 px-4 py-2.5 text-sm text-bark outline-none transition-colors focus:border-honey focus:ring-2 focus:ring-honey/30"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-bark">
                  {t.contact.phone[lang]}
                </label>
                <input
                  type="tel"
                  required
                  dir="ltr"
                  maxLength={30}
                  pattern="[0-9+\s\(\)\-]{6,30}"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={set("phone")}
                  className="w-full rounded-xl border border-bark/15 bg-cream/40 px-4 py-2.5 text-sm text-bark outline-none transition-colors focus:border-honey focus:ring-2 focus:ring-honey/30"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-bark">
                  {t.contact.message[lang]}
                </label>
                <textarea
                  rows={4}
                  required
                  maxLength={1000}
                  value={form.message}
                  onChange={set("message")}
                  className="w-full resize-none rounded-xl border border-bark/15 bg-cream/40 px-4 py-2.5 text-sm text-bark outline-none transition-colors focus:border-honey focus:ring-2 focus:ring-honey/30"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-br from-honey to-amber py-3 text-sm font-semibold text-white shadow-lg shadow-honey/30 transition-transform hover:scale-[1.02]"
              >
                {t.contact.send[lang]}
              </button>
              {sent && (
                <p className="rounded-xl bg-leaf/15 px-4 py-2.5 text-center text-sm font-medium text-leaf">
  {t.contact.sendNote[lang]}
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
