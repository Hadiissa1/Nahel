import { Header } from "@/components/Header";
import { ShuffleHero } from "@/components/ShuffleHero";
import { TrustBar } from "@/components/TrustBar";
import { Shop } from "@/components/Shop";
import { Faq } from "@/components/Faq";
import { WhyOurHoney } from "@/components/WhyOurHoney";
import { Payments } from "@/components/Payments";
import { Testimonials } from "@/components/Testimonials";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <ShuffleHero />

        <TrustBar />
        <Shop />

        <WhyOurHoney />
        <Payments />
        <Testimonials />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
