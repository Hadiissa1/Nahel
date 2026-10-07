"use client";

import { useLang } from "@/components/LanguageProvider";
import { useCatalog } from "@/components/CatalogProvider";
import { Whatsapp } from "@/components/icons";
import { CONTACT } from "@/lib/config";
import { t } from "@/lib/translations";
import { pickText } from "@/lib/catalog-types";

const waUrl = (text: string) => `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;

/**
 * Floating "chat on WhatsApp" button on every shop page. On a product page
 * the message is pre-filled with that product's name.
 *
 * The page address is read when the button is clicked, not while rendering:
 * reading it during rendering would make every product page partly dynamic
 * (it has to sit in <Suspense>), and a page regenerating after an admin change
 * could then mix old HTML with new data.
 */
export function WhatsAppButton() {
  const { lang } = useLang();
  const { byId } = useCatalog();
  const w = t.whatsappButton;

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const path = window.location.pathname;
    if (!path.startsWith("/product/")) return;
    let id = path.slice("/product/".length);
    try {
      id = decodeURIComponent(id);
    } catch {
      return;
    }
    const product = byId.get(id);
    if (product) {
      e.currentTarget.href = waUrl(w.aboutProduct[lang].replace("{p}", pickText(product.name, lang)));
    }
  };

  return (
    <a
      href={waUrl(w.hello[lang])}
      onClick={onClick}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={w.label[lang]}
      className="group fixed end-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex items-center gap-2 rounded-full bg-[#25D366] p-3.5 text-white shadow-lg shadow-black/20 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/40 print:hidden sm:end-6 sm:bottom-6"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366] opacity-25 motion-reduce:hidden"
        style={{ animationIterationCount: 3 }}
      />
      <Whatsapp className="h-7 w-7" />
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 group-hover:max-w-48 group-focus-visible:max-w-48 sm:inline">
        {w.label[lang]}
      </span>
    </a>
  );
}
