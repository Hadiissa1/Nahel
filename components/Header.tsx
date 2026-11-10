"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import { useCart } from "@/components/CartProvider";
import { t } from "@/lib/translations";
import { Bag } from "@/components/icons";

// The three product shelves share one page (/shop, the hash picks the tab);
// every other chapter has its own page.
const links = [
  { href: "/shop#honey", key: "honey" as const },
  { href: "/shop#equipment", key: "equipment" as const },
  { href: "/shop#health", key: "health" as const },
  { href: "/why", key: "why" as const },
  { href: "/payment", key: "pay" as const },
  { href: "/faq", key: "faq" as const },
  { href: "/contact", key: "contact" as const },
  { href: "/blog", key: "tips" as const },
];

export function Header() {
  const { lang, toggle } = useLang();
  const { count, setOpen: setCartOpen } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // Shelf links stay neutral: all three live on /shop.
  const isCurrent = (href: string) => !href.includes("#") && (pathname === href || pathname.startsWith(`${href}/`));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-cream/90 shadow-sm backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-honey to-amber text-white shadow">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" strokeWidth={1.7}>
              <path
                d="M12 4c3 3.5 5 6 5 8.2A5 5 0 0 1 7 12.2C7 10 9 7.5 12 4Z"
                stroke="currentColor"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="font-display text-xl font-bold text-bark-deep">
            {t.brand[lang]}
          </span>
        </Link>

        <ul className="hidden items-center gap-6 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              {/* Plain links: a hash change must reach the shop's tabs. */}
              <a
                href={l.href}
                aria-current={isCurrent(l.href) ? "page" : undefined}
                className={`relative py-2 text-sm font-medium transition-colors hover:text-amber ${
                  isCurrent(l.href)
                    ? "text-amber after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-gradient-to-r after:from-honey after:to-amber"
                    : "text-bark/80"
                }`}
              >
                {t.nav[l.key][lang]}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="rounded-full border border-bark/15 bg-white/60 px-3.5 py-1.5 text-sm font-semibold text-bark transition-colors hover:border-honey hover:text-amber"
            aria-label="Switch language"
          >
            {lang === "en" ? "العربية" : "English"}
          </button>

          {/* Cart button */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative grid h-10 w-10 place-items-center rounded-full border border-bark/15 bg-white/60 text-bark transition-colors hover:border-honey hover:text-amber"
            aria-label={t.cart.title[lang]}
          >
            <Bag className="h-5 w-5" stroke="currentColor" />
            {count > 0 && (
              <span className="absolute -top-1 -end-1 grid h-5 min-w-5 place-items-center rounded-full bg-amber px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </button>

          <button
            onClick={() => setOpen((o) => !o)}
            className="grid h-9 w-9 place-items-center rounded-full border border-bark/15 bg-white/60 text-bark lg:hidden"
            aria-label="Menu"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" strokeWidth={1.8}>
              {open ? (
                <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-bark/10 bg-cream/95 backdrop-blur-md lg:hidden">
          <ul className="space-y-1 px-4 py-3">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  aria-current={isCurrent(l.href) ? "page" : undefined}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium hover:bg-honey/10 hover:text-amber ${
                    isCurrent(l.href) ? "bg-honey/15 text-amber" : "text-bark/80"
                  }`}
                >
                  {t.nav[l.key][lang]}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
