"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { counterSaleAction } from "@/app/admin/actions";
import { a } from "@/lib/admin-i18n";
import { formatPrice, pickText, type AdminProduct, type Variant } from "@/lib/catalog-types";
import type { CounterResult, Payment } from "@/lib/orders";

type Line = { productId: string; variantId: string; qty: number };
type Done = Extract<CounterResult, { ok: true }> & { lines: { name: string; qty: number; price: number }[]; payment: Payment; at: string };

export function PosTerminal({ products }: { products: AdminProduct[] }) {
  const { lang } = useLang();
  const router = useRouter();
  const k = a.pos;
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [discKind, setDiscKind] = useState<"percent" | "amount">("percent");
  const [discValue, setDiscValue] = useState("");
  const [payment, setPayment] = useState<Payment>("cash");
  const [customer, setCustomer] = useState("");
  const [error, setError] = useState<Extract<CounterResult, { ok: false }> | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [pending, start] = useTransition();

  const variants = useMemo(() => {
    const m = new Map<string, { product: AdminProduct; variant: Variant }>();
    for (const p of products) for (const v of p.variants) m.set(v.id, { product: p, variant: v });
    return m;
  }, [products]);
  const name = (variantId: string) => {
    const x = variants.get(variantId);
    return x ? `${pickText(x.product.name, lang)}${x.variant.label ? ` (${x.variant.label})` : ""}` : "?";
  };

  const shown = products.filter((p) => {
    const q = query.trim().toLowerCase();
    return !q || `${p.name.ar} ${p.name.en}`.toLowerCase().includes(q);
  });

  // Shown here for convenience; the server recomputes everything when charging.
  const subtotal = lines.reduce((s, l) => s + (variants.get(l.variantId)?.variant.price ?? 0) * l.qty, 0);
  const dv = parseFloat(discValue.replace(",", "."));
  const discount = !discValue.trim() || !(dv > 0) ? 0 : discKind === "percent" ? Math.round((subtotal * Math.min(dv, 100)) / 100) : Math.min(subtotal, Math.round(dv * 100));
  const total = subtotal - discount;

  const add = (p: AdminProduct, v: Variant) => {
    setError(null);
    setLines((ls) => {
      const ex = ls.find((l) => l.variantId === v.id);
      return ex ? ls.map((l) => (l === ex ? { ...l, qty: l.qty + 1 } : l)) : [...ls, { productId: p.id, variantId: v.id, qty: 1 }];
    });
  };
  const setQty = (variantId: string, qty: number) =>
    setLines((ls) => (qty < 1 ? ls.filter((l) => l.variantId !== variantId) : ls.map((l) => (l.variantId === variantId ? { ...l, qty } : l))));

  const charge = () =>
    start(async () => {
      const r = await counterSaleAction({
        lines: lines.map((l) => ({ id: l.productId, variant: l.variantId, qty: l.qty })),
        discount: discValue.trim() ? { kind: discKind, value: discValue } : null,
        payment,
        customer,
      });
      if (r.ok) {
        setDone({
          ...r,
          payment,
          at: new Date().toLocaleString(lang === "ar" ? "ar-LB" : "en-GB"),
          lines: lines.map((l) => ({ name: name(l.variantId), qty: l.qty, price: variants.get(l.variantId)?.variant.price ?? 0 })),
        });
        setLines([]);
        setDiscValue("");
        setCustomer("");
        router.refresh(); // fresh stock figures
      } else setError(r);
    });

  if (done) {
    return (
      <div className="mx-auto max-w-md px-4 py-6">
        <div id="receipt" className="rounded-2xl border border-bark/10 bg-white p-5 print:border-0 print:shadow-none">
          <p className="text-center font-display text-xl font-bold text-bark-deep">نحّال · Nahel</p>
          <p role="status" className="mt-1 text-center text-sm font-semibold text-leaf">✓ {k.receipt[lang].replace("{n}", String(done.orderId))}</p>
          <p className="text-center text-xs text-bark/50">{done.at}</p>
          <table className="mt-4 w-full text-sm">
            <tbody>
              {done.lines.map((l, i) => (
                <tr key={i} className="border-t border-bark/5">
                  <td className="py-1.5">{l.name}</td>
                  <td className="py-1.5 text-bark/60" dir="ltr">×{l.qty}</td>
                  <td className="py-1.5 text-end">{formatPrice(l.price * l.qty)}</td>
                </tr>
              ))}
              {done.discount > 0 && (
                <tr className="border-t border-bark/10 text-leaf">
                  <td className="py-1.5">{k.discount[lang]}</td>
                  <td />
                  <td className="py-1.5 text-end" dir="ltr">-{formatPrice(done.discount)}</td>
                </tr>
              )}
              <tr className="border-t border-bark/20 font-bold">
                <td className="py-2">{k.total[lang]}</td>
                <td />
                <td className="py-2 text-end">{formatPrice(done.total)}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-2 text-sm text-bark/70">{k.payment[lang]}: {k.pay[done.payment][lang]}</p>
        </div>
        <div className="mt-4 flex gap-2 print:hidden">
          <button type="button" onClick={() => window.print()} className="flex-1 rounded-xl border border-bark/15 bg-white py-2.5 text-sm font-semibold text-bark hover:border-honey">
            🖨️ {k.print[lang]}
          </button>
          <button type="button" onClick={() => setDone(null)} className="flex-1 rounded-xl bg-gradient-to-br from-honey to-amber py-2.5 text-sm font-semibold text-white shadow">
            + {k.newSale[lang]}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="font-display text-2xl font-bold text-bark-deep">{k.title[lang]}</h1>
      <p className="mt-2 rounded-xl bg-honey/10 px-4 py-2.5 text-xs text-bark/70">{k.intro[lang]}</p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_22rem]">
        {/* Products */}
        <section>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={k.search[lang]}
            aria-label={k.search[lang]}
            className="w-full rounded-full border border-bark/15 bg-white px-4 py-2.5 text-sm outline-none focus:border-honey"
          />
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {shown.map((p) => (
              <li key={p.id} aria-label={pickText(p.name, lang)} className="rounded-2xl border border-bark/10 bg-white p-3">
                <p className="text-sm font-semibold text-bark-deep">{pickText(p.name, lang)}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {p.variants.map((v) => {
                    const out = v.stock !== null && v.stock <= 0;
                    const noPrice = v.price === null;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        disabled={out || noPrice}
                        onClick={() => add(p, v)}
                        className="rounded-xl border border-bark/15 bg-cream/40 px-3 py-1.5 text-start text-xs hover:border-honey disabled:opacity-40"
                      >
                        <span className="block font-semibold text-bark">{v.label || "—"}</span>
                        <span className="block text-bark/60">
                          {noPrice ? k.noPrice[lang] : formatPrice(v.price!)}
                          {v.stock !== null && ` · ${out ? k.soldOut[lang] : k.stockLeft[lang].replace("{n}", String(v.stock))}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Ticket */}
        <section aria-label={k.ticket[lang]} className="h-fit space-y-3 rounded-2xl border border-bark/10 bg-white p-4 lg:sticky lg:top-28">
          <h2 className="font-display text-lg font-bold text-bark-deep">🧾 {k.ticket[lang]}</h2>
          {lines.length === 0 ? (
            <p className="text-sm text-bark/55">{k.empty[lang]}</p>
          ) : (
            <ul className="divide-y divide-bark/5">
              {lines.map((l) => {
                const price = variants.get(l.variantId)?.variant.price ?? 0;
                return (
                  <li key={l.variantId} className="flex items-center gap-2 py-2 text-sm">
                    <span className="min-w-0 flex-1 truncate">{name(l.variantId)}</span>
                    <button type="button" aria-label="−" onClick={() => setQty(l.variantId, l.qty - 1)} className="grid h-7 w-7 place-items-center rounded-full border border-bark/15">−</button>
                    <span className="w-6 text-center font-bold" dir="ltr">{l.qty}</span>
                    <button type="button" aria-label="+" onClick={() => setQty(l.variantId, l.qty + 1)} className="grid h-7 w-7 place-items-center rounded-full border border-bark/15">+</button>
                    <span className="w-16 text-end font-semibold">{formatPrice(price * l.qty)}</span>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex items-center gap-2 text-sm">
            <span className="text-bark/70">{k.discount[lang]}</span>
            <input value={discValue} onChange={(e) => setDiscValue(e.target.value)} inputMode="decimal" maxLength={8} dir="ltr" aria-label={k.discount[lang]} className="w-20 rounded-lg border border-bark/15 px-2 py-1 text-sm outline-none focus:border-honey" />
            <select value={discKind} onChange={(e) => setDiscKind(e.target.value as "percent" | "amount")} aria-label={k.discount[lang]} className="rounded-lg border border-bark/15 px-2 py-1 text-sm">
              <option value="percent">%</option>
              <option value="amount">$</option>
            </select>
          </div>

          <dl className="space-y-1 border-t border-bark/10 pt-2 text-sm">
            <div className="flex justify-between text-bark/70"><dt>{k.subtotal[lang]}</dt><dd>{formatPrice(subtotal)}</dd></div>
            {discount > 0 && <div className="flex justify-between text-leaf"><dt>{k.discount[lang]}</dt><dd dir="ltr">-{formatPrice(discount)}</dd></div>}
            <div className="flex justify-between text-lg font-bold text-bark-deep"><dt>{k.total[lang]}</dt><dd>{formatPrice(total)}</dd></div>
          </dl>

          <fieldset>
            <legend className="text-xs font-medium text-bark/70">{k.payment[lang]}</legend>
            <div className="mt-1 grid grid-cols-3 gap-1.5">
              {(["cash", "card", "whish"] as const).map((pm) => (
                <label key={pm} className={`cursor-pointer rounded-xl border px-2 py-2 text-center text-xs font-semibold ${payment === pm ? "border-amber bg-amber text-white" : "border-bark/15 text-bark"}`}>
                  <input type="radio" name="payment" value={pm} checked={payment === pm} onChange={() => setPayment(pm)} className="sr-only" />
                  {k.pay[pm][lang]}
                </label>
              ))}
            </div>
          </fieldset>

          <input value={customer} onChange={(e) => setCustomer(e.target.value)} maxLength={80} placeholder={k.customer[lang]} aria-label={k.customer[lang]} className="w-full rounded-xl border border-bark/15 px-3 py-2 text-sm outline-none focus:border-honey" />

          {error && (
            <div role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {k[`err_${error.error}`][lang]}
              {error.shortages && (
                <ul className="mt-1 list-disc ps-5">
                  {error.shortages.map((s, i) => (
                    <li key={i}>{pickText(s.name, lang)}{s.label ? ` (${s.label})` : ""} — {k.available[lang].replace("{n}", String(s.available))}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button type="button" onClick={() => { setLines([]); setError(null); }} disabled={!lines.length || pending} className="rounded-xl border border-bark/15 px-3 py-2.5 text-sm font-semibold text-bark disabled:opacity-40">
              {k.clear[lang]}
            </button>
            <button type="button" onClick={charge} disabled={!lines.length || pending} className="flex-1 rounded-xl bg-gradient-to-br from-honey to-amber py-2.5 text-sm font-bold text-white shadow disabled:opacity-50">
              {pending ? k.charging[lang] : `💵 ${k.charge[lang].replace("{t}", formatPrice(total))}`}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
