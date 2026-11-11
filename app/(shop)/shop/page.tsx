import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Shop } from "@/components/Shop";

export const metadata: Metadata = {
  title: "المتجر · Shop — نحل لبنان Bee Lebanon",
  description: "عسل لبناني ومصري، منتجات النحل ومعدات النحّالين. Lebanese and Egyptian honey, bee products and beekeeping equipment.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  return (
    <>
      <Header />
      {/* pt-16: room for the fixed header. */}
      <main className="flex-1 pt-16">
        <Shop />
      </main>
      <Footer />
    </>
  );
}
