"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { deleteAlertAction } from "@/app/admin/actions";
import { a } from "@/lib/admin-i18n";
import { pickText } from "@/lib/catalog-types";
import type { ReadyAlert, WaitingGroup } from "@/lib/stock-alerts";

export function AlertList({ ready, waiting }: { ready: ReadyAlert[]; waiting: WaitingGroup[] }) {
  const { lang } = useLang();
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const k = a.alerts;

  const done = (id: string) =>
    startTransition(async () => {
      const r = await deleteAlertAction(id);
      setFailed(!r.ok);
      router.refresh();
    });

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-bark-deep">{k.title[lang]}</h1>
        <p className="mt-2 rounded-xl bg-honey/10 px-4 py-2.5 text-xs text-bark/70">{k.intro[lang]}</p>
      </div>
      {failed && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{k.failed[lang]}</p>
      )}

      <section aria-labelledby="ready-title">
        <h2 id="ready-title" className="font-display text-lg font-bold text-bark-deep">{k.readyTitle[lang]}</h2>
        {ready.length === 0 ? (
          <p className="mt-2 text-sm text-bark/60">{k.readyNone[lang]}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {ready.map((r) => (
              <li
                key={r.id}
                aria-label={r.contact}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-bark/10 bg-white p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-bark-deep" dir="auto">{r.productName}</p>
                  <p className="text-sm text-bark/70">
                    <span dir="ltr">{r.channel === "whatsapp" ? `+${r.contact}` : r.contact}</span>
                    {r.channel === "email" && <span className="ms-1 text-xs text-bark/50">— {k.emailNotSetUp[lang]}</span>}
                    <span className="ms-2 rounded-full bg-bark/10 px-2 py-0.5 text-[11px] font-semibold uppercase">{r.lang}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  {r.whatsappUrl && (
                    <a
                      href={r.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setOpened((s) => new Set(s).add(r.id))}
                      className="rounded-xl bg-[#25D366] px-3 py-1.5 text-sm font-semibold text-white"
                    >
                      {opened.has(r.id) ? "✓ " : ""}
                      {k.open[lang]}
                    </a>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => done(r.id)}
                    className="rounded-xl border border-bark/15 bg-white px-3 py-1.5 text-sm font-semibold text-bark hover:border-honey disabled:opacity-50"
                  >
                    {k.done[lang]}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="waiting-title">
        <h2 id="waiting-title" className="font-display text-lg font-bold text-bark-deep">{k.waitingTitle[lang]}</h2>
        <p className="mt-1 text-xs text-bark/60">{k.waitingHint[lang]}</p>
        {waiting.length === 0 ? (
          <p className="mt-2 text-sm text-bark/60">{k.waitingNone[lang]}</p>
        ) : (
          <ul className="mt-3 divide-y divide-bark/5 rounded-2xl border border-bark/10 bg-white">
            {waiting.map((w, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span className="font-medium text-bark-deep">
                  {pickText(w.name, lang)}
                  {w.label ? ` (${w.label})` : ""}
                </span>
                <span className="text-bark/70">
                  <span className="me-2 rounded-full bg-amber/15 px-2 py-0.5 text-xs font-bold text-amber">
                    🔔 {w.emails + w.whatsapps}
                  </span>
                  {k.people[lang].replace("{e}", String(w.emails)).replace("{w}", String(w.whatsapps))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
