"use client";

import { startTransition as startAction, useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import {
  createPromoCodeAction,
  deletePromoCodeAction,
  setPromoActiveAction,
  type CodeState,
} from "@/app/admin/actions";
import { a } from "@/lib/admin-i18n";
import { formatPrice } from "@/lib/catalog-types";
import type { PromoCode } from "@/lib/promo";

const STATUS_STYLE: Record<PromoCode["status"], string> = {
  active: "bg-leaf/15 text-leaf",
  paused: "bg-bark/10 text-bark/70",
  expired: "bg-red-50 text-red-700",
  used_up: "bg-amber/15 text-amber",
};

export function CodeManager({ codes }: { codes: PromoCode[] }) {
  const { lang } = useLang();
  const router = useRouter();
  const [state, dispatch, creating] = useActionState<CodeState, FormData>(createPromoCodeAction, {});
  const [kind, setKind] = useState<"percent" | "amount">("percent");
  const [busy, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const k = a.codes;
  const errors = state.errors ?? {};
  const err = (f: string) => (errors[f] ? (a.errors[errors[f]!] ?? a.errors.invalid)[lang] : null);

  const run = (fn: () => Promise<{ ok: boolean }>) =>
    startTransition(async () => {
      const r = await fn();
      setFailed(!r.ok);
      router.refresh();
    });

  const field =
    "mt-1 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-bark outline-none focus:border-honey focus:ring-2 focus:ring-honey/30";
  const border = (f: string) => (errors[f] ? "border-red-400" : "border-bark/15");
  const label = "block text-sm font-medium text-bark";

  const describe = (c: PromoCode) =>
    [
      c.kind === "percent" ? `-${c.value}%` : `-${formatPrice(c.value)}`,
      c.minTotal !== null ? k.min[lang].replace("{p}", formatPrice(c.minTotal)) : null,
      c.expiresOn ? k.until[lang].replace("{d}", c.expiresOn) : null,
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-bark-deep">{k.title[lang]}</h1>
        <p className="mt-2 rounded-xl bg-honey/10 px-4 py-2.5 text-xs text-bark/70">{k.intro[lang]}</p>
      </div>

      {/* New code. Keyed by the last created code so the fields reset after success. */}
      <form
        key={state.created ?? "new"}
        // onSubmit (not action=) so React doesn't clear the fields when there are errors.
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startAction(() => dispatch(fd));
        }}
        noValidate
        className="space-y-4 rounded-2xl border border-bark/10 bg-white p-5"
      >
        <h2 className="text-sm font-semibold text-bark">{k.newTitle[lang]}</h2>
        {state.created && (
          <p role="status" className="rounded-xl bg-leaf/15 px-4 py-2.5 text-sm font-medium text-leaf">
            {k.created[lang]} <span dir="ltr">{state.created}</span>
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="code" className={label}>{k.code[lang]}</label>
            <input
              id="code"
              name="code"
              maxLength={20}
              dir="ltr"
              autoCapitalize="characters"
              autoComplete="off"
              placeholder="RAMADAN10"
              className={`${field} ${border("code")} uppercase`}
            />
            <p className="mt-1 text-xs text-bark/55">{k.codeHint[lang]}</p>
            {err("code") && <p className="mt-1 text-xs text-red-700">{err("code")}</p>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="kind" className={label}>{k.kind[lang]}</label>
              <select
                id="kind"
                name="kind"
                value={kind}
                onChange={(e) => setKind(e.target.value === "amount" ? "amount" : "percent")}
                className={`${field} border-bark/15`}
              >
                <option value="percent">{k.percent[lang]}</option>
                <option value="amount">{k.amount[lang]}</option>
              </select>
            </div>
            <div>
              <label htmlFor="value" className={label}>{k.value[lang]}</label>
              <input
                id="value"
                name="value"
                inputMode="decimal"
                maxLength={10}
                dir="ltr"
                placeholder={kind === "percent" ? "10" : "5"}
                className={`${field} ${border("value")}`}
              />
              {err("value") && <p className="mt-1 text-xs text-red-700">{err("value")}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="min_total" className={label}>{k.minTotal[lang]}</label>
            <input id="min_total" name="min_total" inputMode="decimal" maxLength={10} dir="ltr" className={`${field} ${border("min_total")}`} />
            {err("min_total") && <p className="mt-1 text-xs text-red-700">{err("min_total")}</p>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="expires_on" className={label}>{k.expires[lang]}</label>
              <input id="expires_on" name="expires_on" type="date" dir="ltr" className={`${field} ${border("expires_on")}`} />
              {err("expires_on") && <p className="mt-1 text-xs text-red-700">{err("expires_on")}</p>}
            </div>
            <div>
              <label htmlFor="max_uses" className={label}>{k.maxUses[lang]}</label>
              <input id="max_uses" name="max_uses" inputMode="numeric" maxLength={6} dir="ltr" className={`${field} ${border("max_uses")}`} />
              {err("max_uses") && <p className="mt-1 text-xs text-red-700">{err("max_uses")}</p>}
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={creating}
            className="rounded-xl bg-gradient-to-br from-honey to-amber px-6 py-2.5 text-sm font-semibold text-white shadow disabled:opacity-60"
          >
            {creating ? k.creating[lang] : k.create[lang]}
          </button>
        </div>
      </form>

      <section>
        <h2 className="font-display text-lg font-bold text-bark-deep">{k.list[lang]}</h2>
        {failed && (
          <p role="alert" className="mt-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{k.failed[lang]}</p>
        )}
        {codes.length === 0 ? (
          <p className="mt-3 text-sm text-bark/60">{k.empty[lang]}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {codes.map((c) => (
              <li
                key={c.code}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-bark/10 bg-white p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span dir="ltr" className="font-mono text-base font-bold text-bark-deep">{c.code}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[c.status]}`}>
                      {k.status[c.status][lang]}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-bark/70">{describe(c)}</p>
                  <p className="text-xs text-bark/55">
                    {k.uses[lang]}: <span dir="ltr">{c.uses}{c.maxUses !== null ? ` / ${c.maxUses}` : ""}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => setPromoActiveAction(c.code, !c.active))}
                    className="rounded-xl border border-bark/15 bg-white px-3 py-1.5 text-sm font-semibold text-bark hover:border-honey disabled:opacity-50"
                  >
                    {c.active ? k.pause[lang] : k.resume[lang]}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (confirm(k.confirmDelete[lang])) run(() => deletePromoCodeAction(c.code));
                    }}
                    className="rounded-xl border border-bark/15 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:border-red-300 disabled:opacity-50"
                  >
                    {k.delete[lang]}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
