"use client";

import { startTransition, useActionState, useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import { requestStockAlertAction, type AlertState } from "@/app/alerts/actions";
import { t } from "@/lib/translations";

/** "Notify me when it's back" for a sold-out size: a button that opens a one-field form. */
export function NotifyMe({ productId, variantId }: { productId: string; variantId: string }) {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [state, dispatch, pending] = useActionState<AlertState, FormData>(requestStockAlertAction, {});
  const s = t.shop;

  if (state.done) {
    return (
      <p role="status" className="rounded-xl bg-leaf/10 px-3 py-2 text-xs font-medium text-leaf">
        ✓ {s[`notifyDone_${state.done}`][lang]}
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber hover:text-bark"
      >
        🔔 {s.notifyMe[lang]}
      </button>
    );
  }

  return (
    <form
      // onSubmit (not action=) so React doesn't clear the field on errors.
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => dispatch(fd));
      }}
      className="w-full space-y-1.5"
    >
      <input type="hidden" name="product" value={productId} />
      <input type="hidden" name="variant" value={variantId} />
      <input type="hidden" name="lang" value={lang} />
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="flex gap-2">
        <input
          name="contact"
          required
          maxLength={300}
          autoComplete="email"
          dir="ltr"
          aria-label={s.notifyContact[lang]}
          placeholder={s.notifyContact[lang]}
          className="min-w-0 flex-1 rounded-xl border border-bark/15 bg-white px-3 py-2 text-xs text-bark outline-none placeholder:text-start focus:border-honey focus:ring-2 focus:ring-honey/30"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-xl bg-bark-deep px-3 py-2 text-xs font-semibold text-cream hover:bg-bark disabled:opacity-60"
        >
          {s.notifySubmit[lang]}
        </button>
      </div>
      {state.error ? (
        <p role="alert" className="text-[11px] font-medium text-red-700">
          {s[`notifyErr_${state.error}`][lang]}
        </p>
      ) : (
        <p className="text-[11px] text-bark/55">{s.notifyPrivacy[lang]}</p>
      )}
    </form>
  );
}
