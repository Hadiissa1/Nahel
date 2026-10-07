"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { deleteOrderAction, setOrderStatusAction } from "@/app/admin/actions";
import { a } from "@/lib/admin-i18n";
import { formatPrice, pickText } from "@/lib/catalog-types";
import type { Order, OrderStatus, Shortage } from "@/lib/orders";

const NEXT: Record<OrderStatus, OrderStatus[]> = {
  new: ["confirmed", "cancelled"],
  confirmed: ["delivered", "cancelled"],
  delivered: [],
  cancelled: ["new"],
};

const BADGE: Record<OrderStatus, string> = {
  new: "bg-red-100 text-red-800",
  confirmed: "bg-honey/20 text-amber",
  delivered: "bg-leaf/15 text-leaf",
  cancelled: "bg-bark/10 text-bark/60",
};

export function OrderList({ orders }: { orders: Order[] }) {
  const { lang } = useLang();
  const router = useRouter();
  const o = a.orders;
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const [problem, setProblem] = useState<{ id: number; text: string; shortages?: Shortage[] } | null>(null);

  const counts = useMemo(() => {
    const c = { new: 0, confirmed: 0, delivered: 0, cancelled: 0 } as Record<OrderStatus, number>;
    for (const x of orders) c[x.status]++;
    return c;
  }, [orders]);

  const revenue = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7);
    return orders
      .filter((x) => x.status === "delivered" && x.updatedAt.startsWith(month) && x.total !== null)
      .reduce((s, x) => s + x.total!, 0);
  }, [orders]);

  const shown = orders.filter((x) => {
    if (filter !== "all" && x.status !== filter) return false;
    const q = query.trim().toLowerCase().replace(/^#/, "");
    if (!q) return true;
    return (
      String(x.id) === q ||
      x.name.toLowerCase().includes(q) ||
      x.phone.includes(q.replace(/\D/g, "") || "\u0000")
    );
  });

  const change = (id: number, next: OrderStatus) => {
    if (next === "cancelled" && !window.confirm(o.confirmCancel[lang])) return;
    startTransition(async () => {
      const r = await setOrderStatusAction(id, next);
      if (!r.ok) {
        setProblem(
          r.error === "shortage"
            ? { id, text: o.shortage[lang], shortages: r.shortages }
            : { id, text: o.failed[lang] },
        );
      } else {
        setProblem(null);
      }
      router.refresh();
    });
  };

  const remove = (id: number) => {
    if (!window.confirm(o.confirmDelete[lang])) return;
    startTransition(async () => {
      await deleteOrderAction(id);
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            [o.status.new, counts.new, "text-red-700"],
            [o.status.confirmed, counts.confirmed, "text-amber"],
            [o.status.delivered, counts.delivered, "text-leaf"],
            [o.revenue, formatPrice(revenue), "text-bark-deep"],
          ] as const
        ).map(([label, v, color]) => (
          <div key={label.en} className="rounded-2xl border border-bark/10 bg-white p-4">
            <dt className="text-xs font-medium text-bark/60">{label[lang]}</dt>
            <dd className={`mt-1 text-2xl font-bold ${color}`}>{v}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 rounded-xl bg-honey/10 px-4 py-2.5 text-xs text-bark/70">{o.stockNote[lang]}</p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["all", "new", "confirmed", "delivered", "cancelled"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${
                filter === f ? "bg-amber text-white" : "border border-bark/15 bg-white text-bark/80 hover:border-honey"
              }`}
            >
              {f === "all" ? o.all[lang] : o.status[f][lang]}
              {f !== "all" && counts[f] > 0 && <span className="ms-1 opacity-70">({counts[f]})</span>}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={o.search[lang]}
          aria-label={o.search[lang]}
          className="w-full rounded-full border border-bark/15 bg-white px-4 py-2 text-sm outline-none focus:border-honey sm:w-64"
        />
      </div>

      {shown.length === 0 ? (
        <p className="mt-10 text-center text-bark/60">{o.empty[lang]}</p>
      ) : (
        <ul className={`mt-5 space-y-3 ${pending ? "opacity-70" : ""}`}>
          {shown.map((x) => (
            <li key={x.id} className="rounded-2xl border border-bark/10 bg-white p-4" aria-label={`#${x.id}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg font-bold text-bark-deep">#{x.id}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE[x.status]}`}>
                    {o.status[x.status][lang]}
                  </span>
                </div>
                <span className="text-xs text-bark/55" dir="ltr">
                  {x.createdAt.slice(0, 16)}
                </span>
              </div>

              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div className="text-sm">
                  <p className="font-semibold text-bark-deep">{x.name}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2">
                    <span dir="ltr" className="text-bark/80">+{x.phone}</span>
                    <a href={`tel:+${x.phone}`} className="rounded-full border border-bark/15 px-2.5 py-0.5 text-xs font-semibold text-bark hover:border-honey">
                      {o.call[lang]}
                    </a>
                    <a
                      href={`https://wa.me/${x.phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-[#25D366] px-2.5 py-0.5 text-xs font-semibold text-white"
                    >
                      {o.whatsapp[lang]}
                    </a>
                  </p>
                  {x.address && (
                    <p className="mt-2 whitespace-pre-line text-bark/75">
                      <span className="font-medium text-bark">{o.address[lang]}: </span>
                      {x.address}
                    </p>
                  )}
                  {x.note && (
                    <p className="mt-1 whitespace-pre-line text-bark/75">
                      <span className="font-medium text-bark">{o.note[lang]}: </span>
                      {x.note}
                    </p>
                  )}
                </div>

                <table className="w-full text-sm">
                  <tbody>
                    {x.items.map((i, k) => (
                      <tr key={k} className="border-t border-bark/5">
                        <td className="py-1.5 pe-2 text-bark-deep">
                          {pickText(i.name, lang)}
                          {i.label ? ` (${i.label})` : ""}
                        </td>
                        <td className="py-1.5 pe-2 text-bark/70" dir="ltr">×{i.qty}</td>
                        <td className="py-1.5 text-end text-bark/70">
                          {i.unitPrice !== null ? formatPrice(i.unitPrice * i.qty) : "—"}
                        </td>
                      </tr>
                    ))}
                    {x.promoCode && (
                      <>
                        <tr className="border-t border-bark/15 text-bark/70">
                          <td className="py-1.5">{o.subtotal[lang]}</td>
                          <td />
                          <td className="py-1.5 text-end">{x.subtotal !== null ? formatPrice(x.subtotal) : "—"}</td>
                        </tr>
                        <tr className="text-leaf">
                          <td className="py-1.5" dir="auto">🏷️ {o.code[lang].replace("{c}", x.promoCode)}</td>
                          <td />
                          <td className="py-1.5 text-end" dir="ltr">-{formatPrice(x.discount)}</td>
                        </tr>
                      </>
                    )}
                    <tr className="border-t border-bark/15 font-semibold">
                      <td className="py-1.5 text-bark">{o.total[lang]}</td>
                      <td />
                      <td className="py-1.5 text-end text-bark-deep">
                        {x.total !== null ? formatPrice(x.total) : o.onRequest[lang]}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {problem?.id === x.id && (
                <div role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
                  {problem.text}
                  {problem.shortages && (
                    <ul className="mt-1 list-disc ps-5">
                      {problem.shortages.map((s, k) => (
                        <li key={k}>
                          {pickText(s.name, lang)}
                          {s.label ? ` (${s.label})` : ""} — {o.available[lang].replace("{n}", String(s.available))}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {(NEXT[x.status].length > 0 || x.status === "cancelled") && (
                <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-bark/5 pt-3 text-sm">
                  {NEXT[x.status].map((next) => (
                    <button
                      key={next}
                      type="button"
                      disabled={pending}
                      onClick={() => change(x.id, next)}
                      className={`rounded-full px-3.5 py-1.5 font-semibold disabled:opacity-60 ${
                        next === "cancelled"
                          ? "border border-red-200 text-red-700 hover:bg-red-50"
                          : next === "new"
                            ? "border border-bark/15 text-bark hover:border-honey"
                            : "bg-gradient-to-br from-honey to-amber text-white shadow"
                      }`}
                    >
                      {o.actions[next][lang]}
                    </button>
                  ))}
                  {x.status === "cancelled" && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => remove(x.id)}
                      className="rounded-full border border-red-200 px-3.5 py-1.5 font-semibold text-red-700 hover:bg-red-50"
                    >
                      {o.delete[lang]}
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
