"use client";

import Link from "next/link";
import { startTransition, useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { BarChart } from "@/components/admin/BarChart";
import { addExpenseAction, deleteExpenseAction, type ExpenseState } from "@/app/admin/actions";
import { a } from "@/lib/admin-i18n";
import { formatPrice, pickText } from "@/lib/catalog-types";
import type { PeriodKey, Report } from "@/lib/finance";

const CATS = ["stock", "packaging", "transport", "marketing", "rent", "salaries", "other"] as const;
const PERIOD_KEYS: PeriodKey[] = ["today", "yesterday", "week", "month", "last-month", "year", "custom"];

export function FinanceDashboard({ period, report: r, today }: { period: PeriodKey; report: Report; today: string }) {
  const { lang } = useLang();
  const router = useRouter();
  const k = a.fin;
  const pos = a.pos;
  const [from, setFrom] = useState(r.from);
  const [to, setTo] = useState(r.to);
  const [exp, dispatchExp, savingExp] = useActionState<ExpenseState, FormData>(addExpenseAction, {});
  const [busy, startDel] = useTransition();
  const expErr = exp.errors ?? {};
  const err = (f: string) => (expErr[f] ? (a.errors[expErr[f]!] ?? a.errors.invalid)[lang] : null);
  const money = (c: number) => formatPrice(Math.round(c));
  const dayLabel = (d: string) => (r.daily.length > 31 ? d.slice(5, 7) + "/" + d.slice(2, 4) : d.slice(8) + "/" + d.slice(5, 7));
  // Long periods: one bar per month instead of per day.
  const byMonth = r.daily.length > 62;
  const series = (pick: (d: Report["daily"][number]) => number) => {
    if (!byMonth) return r.daily.map((d) => ({ key: d.day, label: dayLabel(d.day), value: pick(d) }));
    const m = new Map<string, number>();
    for (const d of r.daily) m.set(d.day.slice(0, 7), (m.get(d.day.slice(0, 7)) ?? 0) + pick(d));
    return [...m].map(([key, value]) => ({ key, label: key.slice(5) + "/" + key.slice(2, 4), value }));
  };
  const salesSeries = series((d) => d.revenue);
  const visitSeries = series((d) => d.visitors);
  const conversion = r.visitors > 0 ? Math.round((r.webOrdersPlaced / r.visitors) * 1000) / 10 : null;

  const tile = (label: string, value: string, sub?: string, tone = "text-bark-deep") => (
    <div className="rounded-2xl border border-bark/10 bg-white p-4">
      <dt className="text-xs font-medium text-bark/60">{label}</dt>
      <dd className={`mt-1 text-2xl font-bold ${tone}`}>{value}</dd>
      {sub && <dd className="mt-0.5 text-xs text-bark/55">{sub}</dd>}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-bark-deep">💰 {k.title[lang]}</h1>
        <a href={`/admin/finance/export?from=${r.from}&to=${r.to}`} className="rounded-xl border border-bark/15 bg-white px-3 py-1.5 text-sm font-semibold text-bark hover:border-honey">
          ⬇️ {k.export[lang]}
        </a>
      </div>

      {/* Period filter (one row above the charts) */}
      <div className="flex flex-wrap items-center gap-2">
        {PERIOD_KEYS.filter((p) => p !== "custom").map((p) => (
          <Link
            key={p}
            href={`/admin/finance?period=${p}`}
            aria-current={period === p ? "page" : undefined}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${period === p ? "bg-amber text-white" : "border border-bark/15 bg-white text-bark/80 hover:border-honey"}`}
          >
            {k.periods[p][lang]}
          </Link>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/admin/finance?period=custom&from=${from}&to=${to}`);
          }}
          className={`flex flex-wrap items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${period === "custom" ? "border-amber" : "border-bark/15"} bg-white`}
        >
          <label className="text-bark/60" htmlFor="fin-from">{k.from[lang]}</label>
          <input id="fin-from" type="date" value={from} max={today} onChange={(e) => setFrom(e.target.value)} dir="ltr" className="rounded border-0 bg-transparent text-sm" />
          <label className="text-bark/60" htmlFor="fin-to">{k.to[lang]}</label>
          <input id="fin-to" type="date" value={to} max={today} onChange={(e) => setTo(e.target.value)} dir="ltr" className="rounded border-0 bg-transparent text-sm" />
          <button type="submit" className="rounded-full bg-bark-deep px-3 py-1 text-xs font-semibold text-cream">{k.show[lang]}</button>
        </form>
      </div>
      <p className="text-sm text-bark/60" dir="ltr">{r.from === r.to ? r.from : `${r.from} → ${r.to}`}</p>

      {/* Headline numbers */}
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tile(k.revenue[lang], money(r.revenue), k.salesCount[lang].replace("{n}", String(r.sales)))}
        {tile(k.average[lang], money(r.average), `${k.units[lang]}: ${r.units}`)}
        {tile(k.expenses[lang], money(r.expenses.total))}
        {tile(k.profit[lang], money(r.profit), undefined, r.profit < 0 ? "text-red-700" : "text-leaf")}
      </dl>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-bark/60">
        <span>{k.pending[lang].replace("{n}", String(r.pending.orders)).replace("{t}", money(r.pending.revenue))}</span>
        {r.discounts > 0 && <span>{k.discountsGiven[lang].replace("{t}", money(r.discounts))}</span>}
        {r.deliveryFees > 0 && <span>{k.deliveryFees[lang].replace("{t}", money(r.deliveryFees))}</span>}
        {r.cancelled > 0 && <span>{k.cancelled[lang].replace("{n}", String(r.cancelled))}</span>}
        {r.unpriced > 0 && <span className="text-amber">{k.unpriced[lang].replace("{n}", String(r.unpriced))}</span>}
      </div>

      {/* Sales chart */}
      {salesSeries.length > 1 && (
        <section className="rounded-2xl border border-bark/10 bg-white p-4 text-bark">
          <h2 className="mb-2 text-sm font-semibold text-bark-deep">{k.chartSales[lang]}</h2>
          <BarChart data={salesSeries} format={money} label={k.chartSales[lang]} />
          <details className="mt-2 text-xs">
            <summary className="cursor-pointer text-bark/60">{k.asTable[lang]}</summary>
            <table className="mt-2 w-full">
              <thead><tr className="text-bark/55"><th className="text-start">{k.day[lang]}</th><th className="text-end">{k.revenue[lang]}</th></tr></thead>
              <tbody>{salesSeries.map((d) => <tr key={d.key} className="border-t border-bark/5"><td dir="ltr" className="text-start">{d.key}</td><td className="text-end">{money(d.value)}</td></tr>)}</tbody>
            </table>
          </details>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Where and how */}
        <section className="rounded-2xl border border-bark/10 bg-white p-4">
          <h2 className="text-sm font-semibold text-bark-deep">{k.channels[lang]} · {k.payments[lang]}</h2>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {(["web", "counter"] as const).map((c) => (
                <tr key={c} className="border-t border-bark/5">
                  <td className="py-1.5">{c === "web" ? `🌐 ${k.web[lang]}` : `🧾 ${k.counter[lang]}`}</td>
                  <td className="py-1.5 text-bark/60">{r.bySource[c].sales}</td>
                  <td className="py-1.5 text-end font-semibold">{money(r.bySource[c].revenue)}</td>
                </tr>
              ))}
              {(["cash", "card", "whish", "on_delivery"] as const).filter((p) => r.byPayment[p].sales > 0).map((p) => (
                <tr key={p} className="border-t border-bark/5 text-bark/80">
                  <td className="py-1.5 ps-3">{pos.pay[p][lang]}</td>
                  <td className="py-1.5 text-bark/60">{r.byPayment[p].sales}</td>
                  <td className="py-1.5 text-end">{money(r.byPayment[p].revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Best sellers */}
        <section className="rounded-2xl border border-bark/10 bg-white p-4">
          <h2 className="text-sm font-semibold text-bark-deep">🏆 {k.top[lang]}</h2>
          {r.top.length === 0 ? (
            <p className="mt-2 text-sm text-bark/55">{k.none[lang]}</p>
          ) : (
            <table className="mt-2 w-full text-sm">
              <thead><tr className="text-xs text-bark/55"><th className="text-start">{k.product[lang]}</th><th>{k.qty[lang]}</th><th className="text-end">{k.amount[lang]}</th></tr></thead>
              <tbody>
                {r.top.map((t, i) => (
                  <tr key={i} className="border-t border-bark/5">
                    <td className="py-1.5">{pickText(t.name, lang)}{t.label ? ` (${t.label})` : ""}</td>
                    <td className="py-1.5 text-center text-bark/70">{t.units}</td>
                    <td className="py-1.5 text-end font-semibold">{money(t.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      {/* Visitors */}
      <section className="rounded-2xl border border-bark/10 bg-white p-4 text-bark">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-bark-deep">👥 {k.visitors[lang]}</h2>
          {/* Flex items, so the numbers never run together in right-to-left text. */}
          <p className="flex flex-wrap items-baseline gap-x-3 text-sm">
            <span className="text-2xl font-bold text-bark-deep">{r.visitors}</span>
            <span className="text-bark/60">{k.views[lang].replace("{n}", String(r.views))}</span>
            {conversion !== null && <span className="text-leaf">{k.conversion[lang].replace("{p}", String(conversion))}</span>}
          </p>
        </div>
        {r.views === 0 ? (
          <p className="mt-2 text-sm text-bark/55">{k.noVisits[lang]}</p>
        ) : (
          <>
            {visitSeries.length > 1 && <div className="mt-2"><BarChart data={visitSeries} format={(v) => String(Math.round(v))} label={k.chartVisitors[lang]} color="#6b3f1d" /></div>}
            <h3 className="mt-3 text-xs font-semibold text-bark/70">{k.topPages[lang]}</h3>
            <ul className="mt-1 grid gap-x-6 text-sm sm:grid-cols-2">
              {r.topPages.map((p) => (
                <li key={p.path} className="flex justify-between border-t border-bark/5 py-1"><span dir="ltr" className="truncate text-bark/80">{p.path}</span><span className="text-bark/60">{p.views}</span></li>
              ))}
            </ul>
          </>
        )}
        <p className="mt-3 text-[11px] text-bark/50">{k.privacy[lang]}</p>
      </section>

      {/* Expenses */}
      <section className="rounded-2xl border border-bark/10 bg-white p-4">
        <h2 className="text-sm font-semibold text-bark-deep">🧾 {k.expenses[lang]}: {money(r.expenses.total)}</h2>
        <form
          key={exp.saved ?? 0}
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(() => dispatchExp(fd));
          }}
          noValidate
          aria-label={k.addExpense[lang]}
          className="mt-3 grid gap-2 sm:grid-cols-[9rem_1fr_11rem_7rem_auto] sm:items-start"
        >
          <div>
            <label htmlFor="exp-day" className="block text-[11px] text-bark/60">{k.expDay[lang]}</label>
            <input id="exp-day" name="day" type="date" defaultValue={today} max={today} dir="ltr" className="w-full rounded-lg border border-bark/15 px-2 py-1.5 text-sm" />
            {err("day") && <p className="text-[11px] text-red-700">{err("day")}</p>}
          </div>
          <div>
            <label htmlFor="exp-label" className="block text-[11px] text-bark/60">{k.expLabel[lang]}</label>
            <input id="exp-label" name="label" maxLength={120} className="w-full rounded-lg border border-bark/15 px-2 py-1.5 text-sm" />
            {err("label") && <p className="text-[11px] text-red-700">{err("label")}</p>}
          </div>
          <div>
            <label htmlFor="exp-cat" className="block text-[11px] text-bark/60">{k.expCategory[lang]}</label>
            <select id="exp-cat" name="category" defaultValue="packaging" className="w-full rounded-lg border border-bark/15 px-2 py-1.5 text-sm">
              {CATS.map((c) => <option key={c} value={c}>{k.cats[c][lang]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="exp-amount" className="block text-[11px] text-bark/60">{k.expAmount[lang]}</label>
            <input id="exp-amount" name="amount" inputMode="decimal" maxLength={10} dir="ltr" className="w-full rounded-lg border border-bark/15 px-2 py-1.5 text-sm" />
            {err("amount") && <p className="text-[11px] text-red-700">{err("amount")}</p>}
          </div>
          <button type="submit" disabled={savingExp} className="rounded-lg bg-amber px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60 sm:mt-4">+ {k.expAdd[lang]}</button>
        </form>
        {r.expenses.list.length === 0 ? (
          <p className="mt-3 text-sm text-bark/55">{k.expNone[lang]}</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <tbody>
              {r.expenses.list.map((e) => (
                <tr key={e.id} className="border-t border-bark/5">
                  <td className="py-1.5 text-bark/60" dir="ltr">{e.day}</td>
                  <td className="py-1.5">{e.label}</td>
                  <td className="py-1.5 text-bark/60">{k.cats[e.category]?.[lang] ?? e.category}</td>
                  <td className="py-1.5 text-end font-semibold">{money(e.amount)}</td>
                  <td className="py-1.5 text-end">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => startDel(async () => { await deleteExpenseAction(e.id); router.refresh(); })}
                      className="text-xs font-semibold text-red-700 hover:underline disabled:opacity-50"
                    >
                      {k.delete[lang]}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
