import { Header } from "@/components/Header";
import { ShuffleHero } from "@/components/ShuffleHero";
import { TrustBar } from "@/components/TrustBar";
import { HomeExplore } from "@/components/HomeExplore";
import { HoneyFinder } from "@/components/HoneyFinder";
import { Subscribe } from "@/components/Subscribe";
import { Testimonials } from "@/components/Testimonials";
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
        <HomeExplore />
        <HoneyFinder />
        <Testimonials />
        <LatestTips articles={articles} />
        <Subscribe />
      </main>
      <Footer />
    </>
  );
}
