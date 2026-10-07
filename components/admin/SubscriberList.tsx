"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { deleteSubscriberAction, resendConfirmationsAction } from "@/app/admin/actions";
import { a } from "@/lib/admin-i18n";

export interface SubscriberRow {
  id: string;
  email: string | null;
  whatsapp: string | null;
  lang: "ar" | "en";
  emailConfirmed: boolean;
  createdAt: string;
}

export function SubscriberList({
  subscribers,
  canEmail,
}: {
  subscribers: SubscriberRow[];
  canEmail: boolean;
}) {
  const { lang } = useLang();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const s = a.subs;

  const confirmed = subscribers.filter((x) => x.email && x.emailConfirmed).length;
  const waiting = subscribers.filter((x) => x.email && !x.emailConfirmed).length;
  const withWa = subscribers.filter((x) => x.whatsapp).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            [s.total, subscribers.length],
            [s.confirmed, confirmed],
            [s.pending, waiting],
            [s.whatsapp, withWa],
          ] as const
        ).map(([label, v]) => (
          <div key={label.en} className="rounded-2xl border border-bark/10 bg-white p-4">
            <dt className="text-xs font-medium text-bark/60">{label[lang]}</dt>
            <dd className="mt-1 text-2xl font-bold text-bark-deep">{v}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 rounded-xl bg-honey/10 px-4 py-2.5 text-xs text-bark/70">{s.privacyNote[lang]}</p>

      {notice && (
        <p role="status" className="mt-4 rounded-xl bg-leaf/15 px-4 py-2.5 text-sm font-medium text-leaf">
          {notice}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <a
          href="/admin/subscribers/export"
          className="rounded-full border border-bark/15 bg-white px-4 py-2 text-sm font-semibold text-bark hover:border-honey"
        >
          ⬇ {s.export[lang]}
        </a>
        {canEmail && waiting > 0 && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const r = await resendConfirmationsAction();
                if (r) setNotice(s.resent[lang].replace("{sent}", String(r.sent)).replace("{failed}", String(r.failed)));
              })
            }
            className="rounded-full border border-bark/15 bg-white px-4 py-2 text-sm font-semibold text-bark hover:border-honey disabled:opacity-60"
          >
            ✉ {s.resend[lang]}
          </button>
        )}
      </div>

      {subscribers.length === 0 ? (
        <p className="mt-10 text-center text-bark/60">{s.empty[lang]}</p>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-bark/10 bg-white">
          <table className={`w-full text-sm ${pending ? "opacity-70" : ""}`}>
            <thead className="bg-cream-deep/50 text-start text-xs text-bark/60">
              <tr>
                {[s.email, s.phone, s.status, s.language, s.since].map((h) => (
                  <th key={h.en} className="px-4 py-2.5 text-start font-semibold">{h[lang]}</th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {subscribers.map((x) => (
                <tr key={x.id} className="border-t border-bark/5">
                  <td className="px-4 py-2.5" dir="ltr">{x.email ?? "—"}</td>
                  <td className="px-4 py-2.5" dir="ltr">{x.whatsapp ? `+${x.whatsapp}` : "—"}</td>
                  <td className="px-4 py-2.5">
                    {x.email ? (
                      <span className={x.emailConfirmed ? "text-leaf" : "text-bark/60"}>
                        {(x.emailConfirmed ? s.statusConfirmed : s.statusPending)[lang]}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2.5">{x.lang === "ar" ? "العربية" : "English"}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-bark/60" dir="ltr">{x.createdAt.slice(0, 10)}</td>
                  <td className="px-4 py-2.5 text-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (!window.confirm(s.confirmDelete[lang])) return;
                        startTransition(async () => {
                          await deleteSubscriberAction(x.id);
                          router.refresh();
                        });
                      }}
                      className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                    >
                      {s.delete[lang]}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
