"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useLang } from "@/components/LanguageProvider";
import {
  confirmAction,
  unsubscribeAction,
  type TokenState,
} from "@/app/offers/actions";
import { t } from "@/lib/translations";

/**
 * Confirm / unsubscribe pages. The change happens only when the person taps
 * the button (a POST), never on page load: email security scanners open links
 * automatically and must not confirm or cancel anything by themselves.
 */
export function TokenPage({
  mode,
  token,
  valid,
}: {
  mode: "confirm" | "unsubscribe";
  token: string;
  valid: boolean;
}) {
  const { lang } = useLang();
  const o = t.offers;
  const [state, action, pending] = useActionState<TokenState, FormData>(
    mode === "confirm" ? confirmAction : unsubscribeAction,
    {},
  );

  const title = mode === "confirm" ? o.confirmTitle : o.unsubTitle;
  let message: string | null = null;
  if (!valid || state.result === "invalid") message = o.invalidLink[lang];
  else if (state.result === "ok") message = (mode === "confirm" ? o.confirmed : o.unsubscribed)[lang];

  return (
    <main className="honeycomb-bg grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-bark/10 bg-white p-8 text-center shadow-lg">
        <p className="font-display text-2xl font-bold text-bark-deep">{t.brand[lang]} 🍯</p>
        <h1 className="mt-4 text-lg font-semibold text-bark-deep">{title[lang]}</h1>
        {message ? (
          <p role="status" className="mt-4 text-bark/80">{message}</p>
        ) : (
          <form action={action} className="mt-4">
            <input type="hidden" name="token" value={token} />
            {mode === "unsubscribe" && <p className="mb-4 text-sm text-bark/70">{o.unsubText[lang]}</p>}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-gradient-to-br from-honey to-amber py-3 font-semibold text-white shadow disabled:opacity-60"
            >
              {(mode === "confirm" ? o.confirmButton : o.unsubButton)[lang]}
            </button>
          </form>
        )}
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-amber hover:text-bark">
          {o.backToShop[lang]}
        </Link>
      </div>
    </main>
  );
}
