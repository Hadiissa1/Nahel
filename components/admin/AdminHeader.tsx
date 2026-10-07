"use client";

import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";
import { logoutAction } from "@/app/admin/actions";
import { a } from "@/lib/admin-i18n";

export function AdminHeader() {
  const { lang, toggle } = useLang();
  return (
    <header className="sticky top-0 z-40 border-b border-bark/10 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/admin" className="font-display text-lg font-bold text-bark-deep">
          {a.title[lang]}
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <button
            type="button"
            onClick={toggle}
            className="rounded-full border border-bark/15 bg-white px-3 py-1.5 font-semibold text-bark hover:border-honey"
          >
            {lang === "en" ? "العربية" : "English"}
          </button>
          <Link
            href="/"
            className="hidden rounded-full border border-bark/15 bg-white px-3 py-1.5 font-semibold text-bark hover:border-honey sm:inline-block"
          >
            {a.viewShop[lang]}
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-full bg-bark-deep px-3 py-1.5 font-semibold text-cream hover:bg-bark"
            >
              {a.logout[lang]}
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
