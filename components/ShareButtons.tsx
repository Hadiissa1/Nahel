"use client";

import { useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import { Whatsapp } from "@/components/icons";
import { t } from "@/lib/translations";
import { pickText, type CatalogProduct } from "@/lib/catalog-types";

/** Share a product's page: native share sheet (phones), WhatsApp, Facebook, copy link. */
export function ShareButtons({ product }: { product: CatalogProduct }) {
  const { lang } = useLang();
  const [copied, setCopied] = useState(false);
  const s = t.shop;

  // Built on click (not during render) so server and browser HTML match.
  const pageUrl = () => `${window.location.origin}/product/${encodeURIComponent(product.id)}`;
  const title = () => pickText(product.name, lang);
  const open = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt(s.copyLink[lang], pageUrl());
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: title(), url: pageUrl() });
        return;
      } catch {
        return; // cancelled by the user
      }
    }
    await copy();
  };

  const btn =
    "inline-flex items-center gap-1.5 rounded-full border border-bark/15 bg-white px-3 py-1.5 text-xs font-semibold text-bark transition-colors hover:border-honey hover:text-amber";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={share} className={btn}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {s.share[lang]}
      </button>
      <button
        type="button"
        onClick={() => open(`https://wa.me/?text=${encodeURIComponent(`${title()} — ${pageUrl()}`)}`)}
        className={btn}
      >
        <Whatsapp className="h-4 w-4 text-[#25D366]" />
        {s.shareWhatsapp[lang]}
      </button>
      <button
        type="button"
        onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl())}`)}
        className={btn}
      >
        <span className="font-bold text-[#1877F2]">f</span>
        {s.shareFacebook[lang]}
      </button>
      <button type="button" onClick={copy} className={btn} aria-live="polite">
        🔗 {copied ? s.copied[lang] : s.copyLink[lang]}
      </button>
    </div>
  );
}
