import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LotHeading, LotSearch } from "@/components/LotSearch";

export const metadata: Metadata = {
  title: "تحقّق من الدفعة · Check a lot — نحّال Nahel",
  description: "Check where and when your Nahel honey was harvested, with its lab analysis.",
  alternates: { canonical: "/lot" },
};

export default function LotSearchPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-cream pt-28 pb-20">
        <div className="mx-auto max-w-xl space-y-6 px-4">
          <LotHeading />
          <LotSearch />
        </div>
      </main>
      <Footer />
    </>
  );
}
