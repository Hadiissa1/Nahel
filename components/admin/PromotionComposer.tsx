"use client";

import { useActionState, useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import { sendPromotionAction, type PromoState } from "@/app/admin/actions";
import { a } from "@/lib/admin-i18n";

type WaSub = { id: string; number: string; lang: "ar" | "en" };
type Campaign = { id: string; subject: string; sent: number; failed: number; createdAt: string };

const STOP = { ar: "لإلغاء الاشتراك أرسل: توقف", en: "Reply STOP to unsubscribe" };

export function PromotionComposer({
  canEmail,
  emailCount,
  whatsapp,
  history,
}: {
  canEmail: boolean;
  emailCount: number;
  whatsapp: WaSub[];
  history: Campaign[];
}) {
  const { lang } = useLang();
  const p = a.promo;
  const [state, action, pending] = useActionState<PromoState, FormData>(sendPromotionAction, {});
  const [text, setText] = useState({ subject_ar: "", subject_en: "", body_ar: "", body_en: "" });
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const errors = state.errors ?? {};
  const err = (k: string) => (errors[k] ? (a.errors[errors[k]!]?.[lang] ?? a.errors.invalid[lang]) : null);
  const fmt = (s: string, v: Record<string, number>) =>
    Object.entries(v).reduce((acc, [k, n]) => acc.replace(`{${k}}`, String(n)), s);

  const field =
    "mt-1.5 w-full rounded-xl border border-bark/15 bg-white px-3.5 py-2.5 text-sm text-bark outline-none focus:border-honey focus:ring-2 focus:ring-honey/30";

  const waLink = (s: WaSub) => {
    const pick = (k: "subject" | "body") =>
      text[`${k}_${s.lang}`] || text[`${k}_${s.lang === "ar" ? "en" : "ar"}`];
    const msg = [pick("subject"), pick("body"), STOP[s.lang]].filter(Boolean).join("\n\n");
    return `https://wa.me/${s.number}?text=${encodeURIComponent(msg)}`;
  };
  const hasText = (text.subject_ar || text.subject_en) && (text.body_ar || text.body_en);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <h1 className="font-display text-2xl font-bold text-bark-deep">{p.title[lang]}</h1>

      <form action={action} className="space-y-6">
        {/* Message */}
        <section className="space-y-4 rounded-2xl border border-bark/10 bg-white p-5">
          <p className="text-xs text-bark/60">{p.langHint[lang]}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["subject_ar", p.subjectAr, "rtl", false],
                ["subject_en", p.subjectEn, "ltr", false],
                ["body_ar", p.bodyAr, "rtl", true],
                ["body_en", p.bodyEn, "ltr", true],
              ] as const
            ).map(([name, label, dir, area]) => (
              <label key={name} className="block text-sm font-medium text-bark">
                {label[lang]}
                {area ? (
                  <textarea
                    name={name}
                    rows={7}
                    maxLength={5000}
                    dir={dir}
                    value={text[name]}
                    onChange={(e) => setText((t) => ({ ...t, [name]: e.target.value }))}
                    className={`${field} resize-y`}
                  />
                ) : (
                  <input
                    name={name}
                    maxLength={150}
                    dir={dir}
                    value={text[name]}
                    onChange={(e) => setText((t) => ({ ...t, [name]: e.target.value }))}
                    className={field}
                  />
                )}
                {err(name) && <span className="mt-1 block text-xs text-red-700">{err(name)}</span>}
              </label>
            ))}
          </div>
        </section>

        {/* Email */}
        <section className="rounded-2xl border border-bark/10 bg-white p-5">
          <h2 className="font-semibold text-bark-deep">✉ {p.emailTitle[lang]}</h2>
          {!canEmail ? (
            <p className="mt-3 rounded-xl bg-honey/10 px-4 py-3 text-sm text-bark/80">{p.notConfigured[lang]}</p>
          ) : (
            <>
              <p className="mt-2 text-sm text-bark/70">{fmt(p.emailTo[lang], { n: emailCount })}</p>

              {(errors.form || state.result || state.test) && (
                <p
                  role="status"
                  className={`mt-3 rounded-xl px-4 py-2.5 text-sm font-medium ${
                    errors.form || state.test === "failed" ? "bg-red-50 text-red-700" : "bg-leaf/15 text-leaf"
                  }`}
                >
                  {errors.form
                    ? err("form")
                    : state.result
                      ? fmt(p.result[lang], state.result)
                      : state.test === "sent"
                        ? p.testSent[lang]
                        : p.testFailed[lang]}
                </p>
              )}

              <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                <label className="block text-sm font-medium text-bark">
                  {p.testTo[lang]}
                  <input name="test_email" type="email" dir="ltr" maxLength={254} className={field} />
                  {err("test_email") && <span className="mt-1 block text-xs text-red-700">{err("test_email")}</span>}
                </label>
                <select
                  name="test_lang"
                  aria-label="Language"
                  defaultValue={lang}
                  className="rounded-xl border border-bark/15 bg-white px-3.5 py-2.5 text-sm text-bark outline-none focus:border-honey"
                >
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </select>
                <button
                  type="submit"
                  name="mode"
                  value="test"
                  disabled={pending}
                  className="rounded-xl border border-bark/15 bg-white px-4 py-2.5 text-sm font-semibold text-bark hover:border-honey disabled:opacity-60"
                >
                  {p.sendTest[lang]}
                </button>
              </div>

              <button
                type="submit"
                name="mode"
                value="all"
                disabled={pending || emailCount === 0}
                onClick={(e) => {
                  if (!window.confirm(fmt(p.confirmSend[lang], { n: emailCount }))) e.preventDefault();
                }}
                className="mt-4 w-full rounded-xl bg-gradient-to-br from-honey to-amber py-3 text-sm font-semibold text-white shadow disabled:opacity-50"
              >
                {pending ? p.sending[lang] : `${p.sendAll[lang]} (${emailCount})`}
              </button>
            </>
          )}
        </section>
      </form>

      {/* WhatsApp */}
      <section className="rounded-2xl border border-bark/10 bg-white p-5">
        <h2 className="font-semibold text-bark-deep">💬 {p.waTitle[lang]}</h2>
        <p className="mt-2 text-sm text-bark/70">{p.waHint[lang]}</p>
        {whatsapp.length === 0 ? (
          <p className="mt-4 text-sm text-bark/60">{p.waNone[lang]}</p>
        ) : (
          <ul className="mt-4 divide-y divide-bark/5">
            {whatsapp.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-sm text-bark" dir="ltr">
                  {opened.has(s.id) ? "✅ " : ""}+{s.number}{" "}
                  <span className="text-xs text-bark/50">({s.lang === "ar" ? "العربية" : "English"})</span>
                </span>
                <a
                  href={hasText ? waLink(s) : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-disabled={!hasText}
                  onClick={(e) => {
                    if (!hasText) return e.preventDefault();
                    setOpened((o) => new Set(o).add(s.id));
                  }}
                  className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold text-white ${
                    hasText ? "bg-[#25D366]" : "cursor-not-allowed bg-bark/30"
                  }`}
                >
                  {p.waOpen[lang]}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* History */}
      <section className="rounded-2xl border border-bark/10 bg-white p-5">
        <h2 className="font-semibold text-bark-deep">{p.history[lang]}</h2>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-bark/60">{p.noHistory[lang]}</p>
        ) : (
          <ul className="mt-3 divide-y divide-bark/5 text-sm">
            {history.map((c) => (
              <li key={c.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span className="font-medium text-bark-deep">{c.subject}</span>
                <span className="text-bark/60" dir="ltr">
                  {c.createdAt.slice(0, 16)} · ✓ {c.sent} · ✗ {c.failed}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
