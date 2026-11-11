import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Faq } from "@/components/Faq";

export const metadata: Metadata = {
  title: "أسئلة وأجوبة · FAQ — نحل لبنان Bee Lebanon",
  description: "تبلور العسل، الحفظ، الطلب والتوصيل. Crystallized honey, storage, ordering and delivery.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <>
      <Header />
      {/* pt-16: room for the fixed header. */}
      <main className="flex-1 pt-16">
        <Faq />
      </main>
      <Footer />
    </>
  );
}
