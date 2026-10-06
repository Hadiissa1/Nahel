"use client";

import { useEffect } from "react";
import { useLang } from "@/components/LanguageProvider";
import { useCart } from "@/components/CartProvider";
import { t } from "@/lib/translations";
import { CURRENCY } from "@/lib/data";
import { CONTACT } from "@/lib/config";
import { Bag, Plus, Minus, Trash, Close, Whatsapp } from "@/components/icons";

export function Cart() {
  const { lang } = useLang();
  const { items, count, total, hasPrices, open, setOpen, setQty, remove, clear } =
    useCart();

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

  const buildWhatsappLink = () => {
    const lines = items.map((i) => {
      const price =
        typeof i.price === "number" ? ` — ${CURRENCY[lang]}${i.price * i.qty}` : "";
      return `• ${i.name[lang]} ×${i.qty}${price}`;
    });
    let msg = `${t.cart.orderIntro[lang]}\n\n${lines.join("\n")}`;
    if (hasPrices) {
      msg += `\n\n${t.cart.total[lang]}: ${CURRENCY[lang]}${total}`;
    }
    return `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[60] bg-bark-deep/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
      />

      {/* Panel (slides in from the end side; flips for RTL) */}
      <aside
        className={`fixed inset-y-0 end-0 z-[70] flex w-full max-w-md flex-col bg-cream shadow-2xl transition-transform duration-300 ${
          open
            ? "translate-x-0"
            : "translate-x-full rtl:-translate-x-full"
        }`}
        role="dialog"
        aria-label={t.cart.title[lang]}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-bark/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-honey to-amber text-white">
              <Bag className="h-5 w-5" stroke="currentColor" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-bark-deep">
                {t.cart.title[lang]}
              </h2>
              {count > 0 && (
                <p className="text-xs text-bark/60">
                  {count} {count === 1 ? t.cart.item[lang] : t.cart.items[lang]}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-full text-bark/70 transition-colors hover:bg-bark/5 hover:text-bark"
            aria-label="Close"
          >
            <Close className="h-5 w-5" stroke="currentColor" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-honey/10 text-amber">
                <Bag className="h-8 w-8" stroke="currentColor" />
              </span>
              <p className="mt-4 font-semibold text-bark-deep">
                {t.cart.empty[lang]}
              </p>
              <p className="mt-1 text-sm text-bark/60">{t.cart.emptyHint[lang]}</p>
              <button
                onClick={() => setOpen(false)}
                className="mt-6 rounded-full border border-bark/20 bg-white px-5 py-2 text-sm font-semibold text-bark transition-colors hover:border-honey hover:text-amber"
              >
                {t.cart.continue[lang]}
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((i) => (
                <li
                  key={i.id}
                  className="flex items-center gap-3 rounded-2xl border border-bark/10 bg-white/70 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-bark-deep">
                      {i.name[lang]}
                    </p>
                    <p className="truncate text-xs text-bark/55">
                      {i.category[lang]}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-amber">
                      {typeof i.price === "number"
                        ? `${CURRENCY[lang]}${i.price}`
                        : t.cart.priceOnRequest[lang]}
                    </p>
                  </div>

                  {/* Qty controls */}
                  <div className="flex items-center gap-1 rounded-full border border-bark/15 bg-cream/60 p-1">
                    <button
                      onClick={() => setQty(i.id, i.qty - 1)}
                      className="grid h-7 w-7 place-items-center rounded-full text-bark transition-colors hover:bg-honey/15 hover:text-amber"
                      aria-label="Decrease"
                    >
                      <Minus className="h-4 w-4" stroke="currentColor" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-bark-deep">
                      {i.qty}
                    </span>
                    <button
                      onClick={() => setQty(i.id, i.qty + 1)}
                      className="grid h-7 w-7 place-items-center rounded-full text-bark transition-colors hover:bg-honey/15 hover:text-amber"
                      aria-label="Increase"
                    >
                      <Plus className="h-4 w-4" stroke="currentColor" />
                    </button>
                  </div>

                  <button
                    onClick={() => remove(i.id)}
                    className="grid h-8 w-8 place-items-center rounded-full text-bark/50 transition-colors hover:bg-red-500/10 hover:text-red-600"
                    aria-label={t.cart.remove[lang]}
                  >
                    <Trash className="h-4 w-4" stroke="currentColor" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-bark/10 bg-white/60 px-5 py-4">
            {hasPrices && (
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-bark/70">
                  {t.cart.total[lang]}
                </span>
                <span className="font-display text-xl font-bold text-bark-deep">
                  {CURRENCY[lang]}
                  {total}
                </span>
              </div>
            )}
            <a
              href={buildWhatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-semibold text-white shadow-lg shadow-[#25D366]/30 transition-transform hover:scale-[1.02]"
            >
              <Whatsapp className="h-5 w-5" />
              {t.cart.order[lang]}
            </a>
            <button
              onClick={clear}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-medium text-bark/60 transition-colors hover:text-red-600"
            >
              <Trash className="h-4 w-4" stroke="currentColor" />
              {t.cart.clear[lang]}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
