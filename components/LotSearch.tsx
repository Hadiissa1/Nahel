"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { t } from "@/lib/translations";

/** Lot number box: opens /lot/<CODE>. */
export function LotSearch({ initial = "" }: { initial?: string }) {
  const { lang } = useLang();
  const router = useRouter();
  const [code, setCode] = useState(initial);
  const l = t.lots;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const c = code.trim().toUpperCase().replace(/\s+/g, "-");
        if (c) router.push(`/lot/${encodeURIComponent(c.slice(0, 40))}`);
      }}
      className="flex gap-2"
    >
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        maxLength={40}
        dir="ltr"
        autoCapitalize="characters"
        autoComplete="off"
        aria-label={l.codeLabel[lang]}
        placeholder="OAK-2026-01"
        className="min-w-0 flex-1 rounded-xl border border-bark/15 bg-white px-4 py-3 font-mono text-base uppercase text-bark outline-none focus:border-honey focus:ring-2 focus:ring-honey/30"
      />
      <button type="submit" className="rounded-xl bg-gradient-to-br from-honey to-amber px-5 py-3 text-sm font-semibold text-white shadow">
        {l.check[lang]}
      </button>
    </form>
  );
}

export function LotHeading() {
  const { lang } = useLang();
  return (
    <>
      <h1 className="font-display text-3xl font-bold text-bark-deep">🔍 {t.lots.checkTitle[lang]}</h1>
      <p className="mt-2 text-sm text-bark/70">{t.lots.checkIntro[lang]}</p>
    </>
  );
}
