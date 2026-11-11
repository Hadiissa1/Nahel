import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Payments } from "@/components/Payments";

export const metadata: Metadata = {
  title: "الدفع · Payment — نحل لبنان Bee Lebanon",
  description: "ادفع نقداً أو بالبطاقة أو عبر ويش موني. Pay by cash, card or Whish Money.",
  alternates: { canonical: "/payment" },
};

export default function PaymentPage() {
  return (
    <>
      <Header />
      {/* pt-16: room for the fixed header. */}
      <main className="flex-1 pt-16">
        <Payments />
      </main>
      <Footer />
    </>
  );
}
