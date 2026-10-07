"use client";

import { useEffect, useState, useTransition } from "react";
import { useLang } from "@/components/LanguageProvider";
import { useCart, type CartLine } from "@/components/CartProvider";
import { placeOrderAction, type OrderState } from "@/app/orders/actions";
import { t } from "@/lib/translations";
import { formatPrice, pickText } from "@/lib/catalog-types";
import { Bag, Plus, Minus, Trash, Close, Whatsapp } from "@/components/icons";

type Step = "cart" | "details" | "done";

export function Cart() {
  const { lang } = useLang();
  const { lines, count, total, hasPrices, open, setOpen, setQty, remove, clear } = useCart();
  const [step, setStep] = useState<Step>("cart");
  const [result, setResult] = useState<OrderState>({});
  const [pending, startTransition] = useTransition();
  const c = t.cart;

  const label = (l: CartLine) =>
    l.option.label
      ? `${pickText(l.product.name, lang)} (${l.option.label})`
      : pickText(l.product.name, lang);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const close = () => {
    setOpen(false);
    if (step === "done") {
      setStep("cart");
      setResult({});
    }
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("lines", JSON.stringify(lines.map((l) => ({ id: l.id, variant: l.variant, qty: l.qty }))));
    fd.set("lang", lang);
    startTransition(async () => {
      const r = await placeOrderAction({}, fd);
      setResult(r);
      if (r.done) {
        clear();
        setStep("done");
      }
    });
  };

  const errors = {
    name: c.err_name,
    phone: c.err_phone,
    too_long: c.err_too_long,
    empty: c.err_empty,
    unavailable: c.err_unavailable,
    rate: c.err_rate,
  };
  const errorText = result.error ? errors[result.error][lang] : null;
  const field =
    "mt-1 w-full rounded-xl border border-bark/15 bg-white px-3.5 py-2.5 text-sm text-bark outline-none focus:border-honey focus:ring-2 focus:ring-honey/30";

  return (
    <>
      {/* Overlay */}
      <div
        onClick={close}
        className={`fixed inset-0 z-[60] bg-bark-deep/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
      />

      {/* Panel (slides in from the end side; flips for RTL) */}
      <aside
        className={`fixed inset-y-0 end-0 z-[70] flex w-full max-w-md flex-col bg-cream shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full rtl:-translate-x-full"
        }`}
        role="dialog"
        aria-label={c.title[lang]}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-bark/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-honey to-amber text-white">
              <Bag className="h-5 w-5" stroke="currentColor" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-bark-deep">
                {step === "details" ? c.yourDetails[lang] : c.title[lang]}
              </h2>
              {count > 0 && step !== "done" && (
                <p className="text-xs text-bark/60">
                  {count} {count === 1 ? c.item[lang] : c.items[lang]}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={close}
            className="grid h-9 w-9 place-items-center rounded-full text-bark/70 transition-colors hover:bg-bark/5 hover:text-bark"
            aria-label="Close"
          >
            <Close className="h-5 w-5" stroke="currentColor" />
          </button>
        </div>

        {step === "done" && result.done ? (
          /* ---------- Order recorded ---------- */
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-leaf/15 text-3xl">✓</span>
            <p role="status" className="font-display text-xl font-bold text-bark-deep">
              {c.doneTitle[lang].replace("{n}", String(result.done.orderId))}
            </p>
            <p className="text-sm leading-relaxed text-bark/70">{c.doneText[lang]}</p>
            <a
              href={result.done.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-semibold text-white shadow-lg shadow-[#25D366]/30 transition-transform hover:scale-[1.02]"
            >
              <Whatsapp className="h-5 w-5" />
              {c.sendWhatsapp[lang]}
            </a>
            <button onClick={close} className="text-sm font-semibold text-amber hover:text-bark">
              {c.newOrder[lang]}
            </button>
          </div>
        ) : step === "details" && lines.length > 0 ? (
          /* ---------- Customer details ---------- */
          <form onSubmit={submit} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {/* Honeypot: hidden from people, often filled by bots. */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <input type="text" name="website" tabIndex={-1} autoComplete="off" />
              </div>
              <label className="block text-sm font-medium text-bark">
                {c.name[lang]}
                <input name="name" required minLength={2} maxLength={80} autoComplete="name" className={field} />
              </label>
              <label className="block text-sm font-medium text-bark">
                {c.phone[lang]}
                <input
                  name="phone"
                  type="tel"
                  required
                  maxLength={25}
                  autoComplete="tel"
                  dir="ltr"
                  placeholder="+961 …"
                  className={field}
                />
                <span className="mt-1 block text-xs font-normal text-bark/55">{c.phoneHint[lang]}</span>
              </label>
              <label className="block text-sm font-medium text-bark">
                {c.address[lang]}
                <textarea name="address" rows={2} maxLength={300} autoComplete="street-address" className={`${field} resize-none`} />
              </label>
              <label className="block text-sm font-medium text-bark">
                {c.note[lang]}
                <textarea name="note" rows={2} maxLength={500} className={`${field} resize-none`} />
              </label>

              {errorText && (
                <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorText}
                  {result.shortages && (
                    <ul className="mt-1 list-disc ps-5">
                      {result.shortages.map((s, i) => (
                        <li key={i}>
                          {pickText(s.name, lang)}
                          {s.label ? ` (${s.label})` : ""} — {c.available[lang].replace("{n}", String(s.available))}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <p className="text-xs text-bark/55">{c.privacy[lang]}</p>
            </div>

            <div className="border-t border-bark/10 bg-white/60 px-5 py-4">
              {hasPrices && (
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-bark/70">{c.total[lang]}</span>
                  <span className="font-display text-xl font-bold text-bark-deep">{formatPrice(total)}</span>
                </div>
              )}
              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-xl bg-gradient-to-br from-honey to-amber py-3 text-sm font-semibold text-white shadow-lg shadow-honey/30 transition-transform hover:scale-[1.02] disabled:opacity-60"
              >
                {pending ? c.placing[lang] : c.placeOrder[lang]}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("cart");
                  setResult({});
                }}
                className="mt-2 w-full py-2 text-sm font-medium text-bark/60 hover:text-bark"
              >
                {c.back[lang]}
              </button>
            </div>
          </form>
        ) : (
          /* ---------- Cart ---------- */
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {lines.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-honey/10 text-amber">
                    <Bag className="h-8 w-8" stroke="currentColor" />
                  </span>
                  <p className="mt-4 font-semibold text-bark-deep">{c.empty[lang]}</p>
                  <p className="mt-1 text-sm text-bark/60">{c.emptyHint[lang]}</p>
                  <button
                    onClick={close}
                    className="mt-6 rounded-full border border-bark/20 bg-white px-5 py-2 text-sm font-semibold text-bark transition-colors hover:border-honey hover:text-amber"
                  >
                    {c.continue[lang]}
                  </button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {lines.map((i) => (
                    <li key={i.key} className="flex items-center gap-3 rounded-2xl border border-bark/10 bg-white/70 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-bark-deep">{label(i)}</p>
                        <p className="truncate text-xs text-bark/55">{t.nav[i.product.category][lang]}</p>
                        <p className="mt-0.5 text-xs font-semibold text-amber">
                          {i.option.price !== null ? formatPrice(i.option.price) : c.priceOnRequest[lang]}
                        </p>
                      </div>

                      {/* Qty controls */}
                      <div className="flex items-center gap-1 rounded-full border border-bark/15 bg-cream/60 p-1">
                        <button
                          onClick={() => setQty(i.key, i.qty - 1)}
                          className="grid h-7 w-7 place-items-center rounded-full text-bark transition-colors hover:bg-honey/15 hover:text-amber"
                          aria-label="Decrease"
                        >
                          <Minus className="h-4 w-4" stroke="currentColor" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-bark-deep">{i.qty}</span>
                        <button
                          onClick={() => setQty(i.key, i.qty + 1)}
                          disabled={i.qty >= i.max}
                          className="grid h-7 w-7 place-items-center rounded-full text-bark transition-colors hover:bg-honey/15 hover:text-amber disabled:opacity-30"
                          aria-label="Increase"
                        >
                          <Plus className="h-4 w-4" stroke="currentColor" />
                        </button>
                      </div>

                      <button
                        onClick={() => remove(i.key)}
                        className="grid h-8 w-8 place-items-center rounded-full text-bark/50 transition-colors hover:bg-red-500/10 hover:text-red-600"
                        aria-label={c.remove[lang]}
                      >
                        <Trash className="h-4 w-4" stroke="currentColor" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {lines.length > 0 && (
              <div className="border-t border-bark/10 bg-white/60 px-5 py-4">
                {hasPrices && (
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-bark/70">{c.total[lang]}</span>
                    <span className="font-display text-xl font-bold text-bark-deep">{formatPrice(total)}</span>
                  </div>
                )}
                <button
                  onClick={() => setStep("details")}
                  className="w-full rounded-xl bg-gradient-to-br from-honey to-amber py-3 text-sm font-semibold text-white shadow-lg shadow-honey/30 transition-transform hover:scale-[1.02]"
                >
                  {c.checkout[lang]}
                </button>
                <button
                  onClick={clear}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-medium text-bark/60 transition-colors hover:text-red-600"
                >
                  <Trash className="h-4 w-4" stroke="currentColor" />
                  {c.clear[lang]}
                </button>
              </div>
            )}
          </>
        )}
      </aside>
    </>
  );
}
