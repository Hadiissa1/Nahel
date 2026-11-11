import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhyOurHoney } from "@/components/WhyOurHoney";
import { BeeLifeCycle } from "@/components/BeeLifeCycle";
import { HoneyJourney } from "@/components/HoneyJourney";

export const metadata: Metadata = {
  title: "كيف يُصنع العسل · How honey is made — نحل لبنان Bee Lebanon",
  description: "رافق النحلة من الزهرة إلى المرطبان في ست خطوات. Follow the bee from flower to jar in six steps, and see why our honey is raw and pure.",
  alternates: { canonical: "/why" },
};

export default function WhyPage() {
  return (
    <>
      <Header />
      {/* pt-16: room for the fixed header. */}
      <main className="flex-1 pt-16">
        <WhyOurHoney />
        <BeeLifeCycle />
        <HoneyJourney />
      </main>
      <Footer />
    </>
  );
}
