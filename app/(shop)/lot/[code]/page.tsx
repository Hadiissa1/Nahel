import { Suspense } from "react";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LotHeading, LotSearch } from "@/components/LotSearch";
import { LotResult } from "@/components/LotResult";
import { getLotByCode } from "@/lib/lots";
import { getProduct } from "@/lib/products";
import { normalizeLotCode } from "@/lib/lot-types";

/** Lot pages render on first visit (codes are typed or scanned by customers). */
export async function generateStaticParams() {
  return [{ code: "__none__" }];
}

export const metadata: Metadata = {
  title: "تحقّق من الدفعة · Check a lot — نحّال Nahel",
  // One page per jar batch: useful to customers, not to search results.
  robots: { index: false },
};

export default function LotPage({ params }: PageProps<"/lot/[code]">) {
  return (
    <>
      <Header />
      <main className="flex-1 bg-cream pt-28 pb-20">
        <div className="mx-auto max-w-2xl space-y-6 px-4">
          <LotHeading />
          {/* params are read inside <Suspense> (see the product page). */}
          <Suspense fallback={<div className="h-48 rounded-3xl bg-white/50" />}>
            <Content params={params} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}

async function Content({ params }: { params: PageProps<"/lot/[code]">["params"] }) {
  const param = (await params).code;
  let raw = param;
  try {
    raw = decodeURIComponent(param);
  } catch {
    /* malformed escape: use as is */
  }
  raw = raw.slice(0, 40);
  const code = normalizeLotCode(raw);
  const lot = code ? await getLotByCode(code) : null;
  const product = lot ? await getProduct(lot.productId) : undefined;
  return (
    <>
      <LotResult code={raw} lot={lot} product={product} />
      <LotSearch />
    </>
  );
}
