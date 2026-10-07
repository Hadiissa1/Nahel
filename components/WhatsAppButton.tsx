"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { useCatalog } from "@/components/CatalogProvider";
import { Whatsapp } from "@/components/icons";
import { CONTACT } from "@/lib/config";
import { t } from "@/lib/translations";
import { pickText } from "@/lib/catalog-types";

/**
 * Floating "chat on WhatsApp" button on every shop page. On a product page
 * the message is pre-filled with that product's name.
 *
 * Reading the URL must happen inside <Suspense> (pages are prerendered): the
 * prerendered page shows the generic button, the product one streams in.
 */
export function WhatsAppButton() {
  return (
    <Suspense fallback={<WhatsAppLink />}>
      <ForCurrentPage />
    </Suspense>
  );
}

function ForCurrentPage() {
  const { lang } = useLang();
  const { byId } = useCatalog();
  const path = usePathname();
  const productId = path.startsWith("/product/") ? decodeURIComponent(path.slice("/product/".length)) : null;
  const product = productId ? byId.get(productId) : undefined;
  return (
    <WhatsAppLink
      text={product && t.whatsappButton.aboutProduct[lang].replace("{p}", pickText(product.name, lang))}
    />
  );
}

function WhatsAppLink({ text: custom }: { text?: string }) {
  const { lang } = useLang();
  const w = t.whatsappButton;
  const text = custom ?? w.hello[lang];

  return (
    <a
      href={`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`}
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
