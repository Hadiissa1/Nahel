import { Header } from "@/components/Header";
import { ShuffleHero } from "@/components/ShuffleHero";
import { ProductSection } from "@/components/ProductSection";
import { WhyOurHoney } from "@/components/WhyOurHoney";
import { Payments } from "@/components/Payments";
import { Testimonials } from "@/components/Testimonials";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { t } from "@/lib/translations";
import { honeyProducts, equipmentProducts, healthProducts } from "@/lib/data";
import type { IconName } from "@/components/icons";

const honeyIcons: Record<string, IconName> = {
  oak: "HoneyJar",
  lemon: "Drop",
  eucalyptus: "Leaf",
  jardi: "Honeycomb",
  baraka: "Drop",
  "sidr-egy": "HoneyJar",
  "sidr-kashmir": "HoneyJar",
  clover: "Leaf",
  thyme: "Leaf",
  comb: "Honeycomb",
};

const healthIcons: Record<string, IconName> = {
  pollen: "Sparkle",
  "royal-jelly": "Drop",
  ginseng: "Leaf",
  "propolis-local": "Shield",
  "propolis-import": "Shield",
  "palm-pollen": "Sparkle",
};

const equipmentIcons: Record<string, IconName> = {
  "foundation-wax": "Honeycomb",
  "drawn-wax": "Honeycomb",
  hives: "Hive",
  frames: "Hive",
  supers: "Hive",
  barrels: "HoneyJar",
  "pollen-traps": "Sparkle",
  extractors: "Drop",
  suits: "Shield",
  candy: "Drop",
  bees: "Bee",
};

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <ShuffleHero />

        <ProductSection
          id="honey"
          eyebrow={t.honey.eyebrow}
          title={t.honey.title}
          subtitle={t.honey.subtitle}
          products={honeyProducts}
          icons={honeyIcons}
          tone="white"
        />

        <ProductSection
          id="equipment"
          eyebrow={t.equipment.eyebrow}
          title={t.equipment.title}
          subtitle={t.equipment.subtitle}
          products={equipmentProducts}
          icons={equipmentIcons}
          tone="cream"
        />

        <ProductSection
          id="health"
          eyebrow={t.health.eyebrow}
          title={t.health.title}
          subtitle={t.health.subtitle}
          products={healthProducts}
          icons={healthIcons}
          tone="white"
        />

        <WhyOurHoney />
        <Payments />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
