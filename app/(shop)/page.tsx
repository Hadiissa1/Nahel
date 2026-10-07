import { Header } from "@/components/Header";
import { ShuffleHero } from "@/components/ShuffleHero";
import { TrustBar } from "@/components/TrustBar";
import { Shop } from "@/components/Shop";
import { Faq } from "@/components/Faq";
import { Subscribe } from "@/components/Subscribe";
import { WhyOurHoney } from "@/components/WhyOurHoney";
import { Payments } from "@/components/Payments";
import { Testimonials } from "@/components/Testimonials";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { LatestTips } from "@/components/BlogViews";
import { getPublishedArticles } from "@/lib/articles";

export default async function Home() {
  // Cached and shared by all visitors; expired when an article is saved.
  const articles = await getPublishedArticles();
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
        <LatestTips articles={articles} />
        <Faq />
        <Subscribe />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
