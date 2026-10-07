"use client";

import { useActionState } from "react";
import { useLang } from "@/components/LanguageProvider";
import { loginAction, type LoginState } from "@/app/admin/actions";
import { a } from "@/lib/admin-i18n";

export function LoginForm() {
  const { lang, toggle } = useLang();
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-3xl border border-bark/10 bg-white p-7 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-bark-deep">{a.login.title[lang]}</h1>
          <button
            type="button"
            onClick={toggle}
            className="rounded-full border border-bark/15 px-3 py-1 text-xs font-semibold text-bark"
          >
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
        <label className="mt-6 block text-sm font-medium text-bark" htmlFor="password">
          {a.login.password[lang]}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          maxLength={200}
          autoComplete="current-password"
          dir="ltr"
          className="mt-1.5 w-full rounded-xl border border-bark/15 bg-cream/40 px-4 py-2.5 text-bark outline-none focus:border-honey focus:ring-2 focus:ring-honey/30"
        />
        {state.error && (
          <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {a.login[state.error][lang]}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="mt-5 w-full rounded-xl bg-gradient-to-br from-honey to-amber py-2.5 font-semibold text-white shadow disabled:opacity-60"
        >
          {a.login.submit[lang]}
        </button>
      </form>
    </main>
  );
}
