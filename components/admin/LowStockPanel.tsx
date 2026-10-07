"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import { saveStockSettingsAction, type StockSettingsState } from "@/app/admin/actions";
import { a } from "@/lib/admin-i18n";
import { pickText } from "@/lib/catalog-types";
import type { LowStockItem, StockSettings } from "@/lib/low-stock";

/** Top of the products page: sizes running low, and the alert settings. */
export function LowStockPanel({
  settings,
  low,
  canEmail,
  canEditSettings = true,
}: {
  settings: StockSettings;
  low: LowStockItem[];
  canEmail: boolean;
  canEditSettings?: boolean;
}) {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [state, dispatch, saving] = useActionState<StockSettingsState, FormData>(saveStockSettingsAction, {});
  const k = a.low;
  const errors = state.errors ?? {};
  const err = (f: string) => (errors[f] ? (a.errors[errors[f]!] ?? a.errors.invalid)[lang] : null);
  const field = (f: string) =>
    `mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm text-bark outline-none focus:border-honey focus:ring-2 focus:ring-honey/30 ${
      errors[f] ? "border-red-400" : "border-bark/15"
    }`;

  return (
    <section
      aria-labelledby="low-title"
      className={`mb-5 rounded-2xl border p-4 ${low.length ? "border-amber/40 bg-honey/10" : "border-bark/10 bg-white"}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="low-title" className="font-semibold text-bark-deep">
          {low.length ? "⚠️ " : "✓ "}
          {k.title[lang]}
          {low.length > 0 && <span className="ms-1 text-amber">({low.length})</span>}
        </h2>
        {canEditSettings && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="text-sm font-semibold text-amber hover:text-bark"
        >
          ⚙️ {k.settings[lang]}
        </button>
        )}
      </div>

      {low.length === 0 ? (
        <p className="mt-1 text-sm text-bark/60">{k.none[lang].replace("{n}", String(settings.threshold))}</p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-2">
          {low.map((i) => (
            <li key={i.variantId}>
              {(() => {
                const content = (
                  <>
                {pickText(i.name, lang)}
                {i.label ? ` (${i.label})` : ""}
                <span className={i.stock <= 0 ? "" : "text-amber"}>
                  · {i.stock <= 0 ? k.soldOut[lang] : k.left[lang].replace("{n}", String(i.stock))}
                </span>
                  </>
                );
                const chip = `inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                  i.stock <= 0 ? "border-red-300 bg-red-50 text-red-700" : "border-amber/40 bg-white text-bark"
                }`;
                return canEditSettings ? (
                  <Link href={`/admin/products/${encodeURIComponent(i.productId)}`} className={`${chip} hover:border-honey`}>
                    {content}
                  </Link>
                ) : (
                  <span className={chip}>{content}</span>
                );
              })()}
            </li>
          ))}
        </ul>
      )}

      {open && canEditSettings && (
        <form
          // onSubmit (not action=) so React doesn't clear the fields on errors.
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(() => dispatch(fd));
          }}
          noValidate
          className="mt-4 grid gap-3 border-t border-bark/10 pt-4 sm:grid-cols-[8rem_1fr_auto] sm:items-start"
        >
          <div>
            <label htmlFor="low-threshold" className="block text-xs font-medium text-bark/80">{k.threshold[lang]}</label>
            <input id="low-threshold" name="threshold" defaultValue={settings.threshold} inputMode="numeric" maxLength={4} dir="ltr" className={field("threshold")} />
            {err("threshold") && <p className="mt-1 text-[11px] text-red-700">{err("threshold")}</p>}
          </div>
          <div>
            <label htmlFor="low-email" className="block text-xs font-medium text-bark/80">{k.email[lang]}</label>
            <input id="low-email" name="email" type="email" defaultValue={settings.email ?? ""} maxLength={300} dir="ltr" className={field("email")} />
            {err("email") ? (
              <p className="mt-1 text-[11px] text-red-700">{err("email")}</p>
            ) : (
              <p className="mt-1 text-[11px] text-bark/55">{canEmail ? k.emailHint[lang] : k.noMail[lang]}</p>
            )}
          </div>
          <div className="flex items-center gap-2 sm:mt-5">
            <button type="submit" disabled={saving} className="rounded-xl bg-gradient-to-br from-honey to-amber px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-60">
              {k.save[lang]}
            </button>
            {state.saved && !saving && <span role="status" className="text-xs font-medium text-leaf">✓ {k.saved[lang]}</span>}
          </div>
        </form>
      )}
    </section>
  );
}
