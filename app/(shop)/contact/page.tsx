import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Contact } from "@/components/Contact";

export const metadata: Metadata = {
  title: "تواصل معنا · Contact — نحل لبنان Bee Lebanon",
  description: "راسلنا على واتساب أو اتصل بنا. Message us on WhatsApp or call us.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <Header />
      {/* pt-16: room for the fixed header. */}
      <main className="flex-1 pt-16">
        <Contact />
      </main>
      <Footer />
    </>
  );
}
