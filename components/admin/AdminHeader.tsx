"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { logoutAction } from "@/app/admin/actions";
import { a } from "@/lib/admin-i18n";

export function AdminHeader({
  isOwner = true,
  userName = null,
  newOrders = 0,
  readyAlerts = 0,
  pendingReviews = 0,
  lowStock = 0,
}: {
  isOwner?: boolean;
  /** Staff member's name (shown in the header); null for the owner. */
  userName?: string | null;
  newOrders?: number;
  readyAlerts?: number;
  pendingReviews?: number;
  lowStock?: number;
}) {
  const { lang, toggle } = useLang();
  const path = usePathname();
  const all = [
    { href: "/admin/orders", staff: true, label: a.nav.orders[lang], active: path.startsWith("/admin/orders"), badge: newOrders },
    { href: "/admin/pos", staff: true, label: a.nav.pos[lang], active: path.startsWith("/admin/pos") },
    { href: "/admin/finance", label: a.nav.finance[lang], active: path.startsWith("/admin/finance") },
    { href: "/admin", staff: true, label: a.nav.products[lang], active: path === "/admin" || path.startsWith("/admin/products"), badge: lowStock },
    { href: "/admin/subscribers", label: a.nav.subscribers[lang], active: path.startsWith("/admin/subscribers") },
    { href: "/admin/promotions", label: a.nav.promotions[lang], active: path.startsWith("/admin/promotions") },
    { href: "/admin/articles", label: a.nav.articles[lang], active: path.startsWith("/admin/articles") },
    { href: "/admin/lots", label: a.nav.lots[lang], active: path.startsWith("/admin/lots") },
    { href: "/admin/reviews", label: a.nav.reviews[lang], active: path.startsWith("/admin/reviews"), badge: pendingReviews },
    { href: "/admin/alerts", staff: true, label: a.nav.alerts[lang], active: path.startsWith("/admin/alerts"), badge: readyAlerts },
    { href: "/admin/codes", label: a.nav.codes[lang], active: path.startsWith("/admin/codes") },
    { href: "/admin/delivery", label: a.nav.delivery[lang], active: path.startsWith("/admin/delivery") },
    { href: "/admin/team", label: a.nav.team[lang], active: path.startsWith("/admin/team") },
  ];
  // Staff only see what they may use (the server refuses the rest anyway).
  const tabs = all.filter((t) => isOwner || ("staff" in t && t.staff));
  return (
    <header className="sticky top-0 z-40 border-b border-bark/10 bg-cream/95 backdrop-blur print:hidden">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/admin" className="font-display text-lg font-bold text-bark-deep">
          {a.title[lang]}
        </Link>
        <div className="flex items-center gap-2 text-sm">
          {userName && (
            <span className="hidden max-w-40 truncate rounded-full bg-honey/15 px-3 py-1.5 font-semibold text-bark sm:inline" title={userName}>
              👤 {userName}
            </span>
          )}
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
      <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={tab.active ? "page" : undefined}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold ${
              tab.active ? "bg-amber text-white" : "text-bark/75 hover:bg-honey/10"
            }`}
          >
            {tab.label}
            {"badge" in tab && !!tab.badge && (
              <span className="ms-1.5 rounded-full bg-red-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
                {tab.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </header>
  );
}
