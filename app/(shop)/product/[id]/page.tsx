import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductDetail } from "@/components/ProductDetail";
import { getCatalog, getProduct } from "@/lib/products";
import { siteUrl } from "@/lib/site";
import { isOutOfStock, photoUrl, type CatalogProduct } from "@/lib/catalog-types";

/** Products that exist at build time are prerendered; new ones render on first visit. */
export async function generateStaticParams() {
  const products = await getCatalog();
  // Cache Components needs at least one entry; an unknown id simply 404s.
  return products.length ? products.map((p) => ({ id: p.id })) : [{ id: "__none__" }];
}

const shorten = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);

function titleOf(p: CatalogProduct) {
  return `${[p.name.ar, p.name.en].filter(Boolean).join(" | ")} — نحّال Nahel`;
}

export async function generateMetadata({ params }: PageProps<"/product/[id]">): Promise<Metadata> {
  const { id } = await params;
  const p = await getProduct(id);
  if (!p) return { title: "نحّال Nahel", robots: { index: false } };

  const title = titleOf(p);
  const description = shorten([p.desc.ar, p.desc.en].filter(Boolean).join(" — "), 200);
  const url = `/product/${encodeURIComponent(p.id)}`;
  // The photo id in the URL makes apps fetch a new preview when the photo changes.
  const image = `/og/${encodeURIComponent(p.id)}?v=${p.photo ?? "none"}`;
  const priced = p.variants.find((v) => v.price !== null && !isOutOfStock(v));

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: "نحّال Nahel",
      locale: "ar_LB",
      alternateLocale: ["en_US"],
      title,
      description,
      url,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    ...(priced && {
      other: {
        "product:price:amount": (priced.price! / 100).toFixed(2),
        "product:price:currency": "USD",
      },
    }),
  };
}

/** schema.org Product data so Google can show name, photo, price and stock. */
function jsonLd(p: CatalogProduct) {
  const base = siteUrl() ?? "";
  const url = `${base}/product/${encodeURIComponent(p.id)}`;
  const offers = p.variants
    .filter((v) => v.price !== null)
    .map((v) => ({
      "@type": "Offer",
      ...(v.label && { name: v.label }),
      price: (v.price! / 100).toFixed(2),
      priceCurrency: "USD",
      availability: isOutOfStock(v) ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      url,
    }));
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name.ar || p.name.en,
    ...(p.name.ar && p.name.en && { alternateName: p.name.en }),
    description: p.desc.ar || p.desc.en,
    ...(p.photo && { image: `${base}${photoUrl(p.photo, "lg")}` }),
    brand: { "@type": "Brand", name: "Nahel" },
    url,
    ...(offers.length && { offers }),
  };
  // "<" escaped so text can never close the script tag.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default function ProductPage({ params }: PageProps<"/product/[id]">) {
  return (
    <>
      <Header />
      <Suspense fallback={<main className="min-h-[70vh] flex-1 bg-cream" />}>
        <Content params={params} />
      </Suspense>
      <Footer />
    </>
  );
}

/**
 * params must be awaited inside <Suspense> (Cache Components + Partial
 * Prefetching): reading them at the top level makes runtime regeneration fail.
 * Consequence: the very first visit to an unknown product answers 200 with the
 * not-found page and a noindex tag; later visits answer 404.
 */
async function Content({ params }: { params: PageProps<"/product/[id]">["params"] }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();
  const related = (await getCatalog())
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);
  return (
    <>
      <ProductDetail product={product} related={related} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(product) }} />
    </>
  );
}
