"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import { t } from "@/lib/translations";
import { SafeImage } from "@/components/SafeImage";
import { Bee, Honeycomb } from "@/components/icons";
import type { IconName } from "@/components/icons";

type Tile = { id: number; src: string; alt: string; icon: IconName };

const U = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=70`;

/** Honey, queen bee, bees and beekeeping-equipment photos. */
const tiles: Tile[] = [
  { id: 1, src: U("1587049352846-4a222e784d38"), alt: "Honey jars", icon: "HoneyJar" },
  { id: 2, src: U("1558642452-9d2a7deb7f62"), alt: "Honey drizzle", icon: "Drop" },
  { id: 3, src: U("1473973266408-ed4e27abdd47"), alt: "Honeycomb", icon: "Honeycomb" },
  { id: 4, src: U("1568526381923-caf3fd520382"), alt: "Bees on comb", icon: "Bee" },
  { id: 5, src: U("1607344645866-009c320b63e0"), alt: "Beekeeper", icon: "Hive" },
  { id: 6, src: U("1471943311424-646960669fbc"), alt: "Honey dipper", icon: "Drop" },
  { id: 7, src: U("1602523961854-9c6c9f7f0f6a"), alt: "Queen bee", icon: "Bee" },
  { id: 8, src: U("1550482491-9a9d4c3f3f5b"), alt: "Beehives", icon: "Hive" },
  { id: 9, src: U("1559827260-dc66d52bef19"), alt: "Bees flying", icon: "Bee" },
  { id: 10, src: U("1516824711718-9c1e683412ac"), alt: "Honey pot", icon: "HoneyJar" },
  { id: 11, src: U("1444858345149-8d9f08e7f3a4"), alt: "Honeycomb frame", icon: "Honeycomb" },
  { id: 12, src: U("1599639668273-01f5c4f0a6d2"), alt: "Beekeeping tools", icon: "Hive" },
  { id: 13, src: U("1606923829579-0cb981a83e2e"), alt: "Honey spoon", icon: "Drop" },
  { id: 14, src: U("1551649001-7a2482d98d05"), alt: "Honeycomb close", icon: "Honeycomb" },
  { id: 15, src: U("1498936178812-4b2e558d2937"), alt: "Bee on flower", icon: "Bee" },
  { id: 16, src: U("1473496169904-658ba7c44d8a"), alt: "Honey harvest", icon: "HoneyJar" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ShuffleGrid() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [order, setOrder] = useState<Tile[]>(tiles);

  useEffect(() => {
    const run = () => {
      setOrder(shuffle(tiles));
      timeoutRef.current = setTimeout(run, 3000);
    };
    run();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="grid grid-cols-4 grid-rows-4 gap-2 h-[340px] sm:h-[440px] lg:h-[500px]">
      {order.map((tile) => (
        <motion.div
          key={tile.id}
          layout
          transition={{ duration: 1.4, type: "spring" }}
          className="h-full w-full"
        >
          <SafeImage
            src={tile.src}
            alt={tile.alt}
            icon={tile.icon}
            className="h-full w-full rounded-lg shadow-sm"
          />
        </motion.div>
      ))}
    </div>
  );
}

export function ShuffleHero() {
  const { lang } = useLang();

  return (
    <section
      id="home"
      className="honeycomb-bg relative overflow-hidden pt-28 pb-20 sm:pt-32"
    >
      <div className="pointer-events-none absolute -top-24 -end-24 h-80 w-80 rounded-full bg-honey/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -start-24 h-80 w-80 rounded-full bg-amber/15 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="animate-fade-up text-center lg:text-start">
          <span className="inline-flex items-center gap-2 rounded-full border border-honey/40 bg-white/70 px-4 py-1.5 text-xs font-semibold text-amber shadow-sm">
            <Bee className="h-4 w-4" stroke="currentColor" />
            {t.hero.badge[lang]}
          </span>

          <h1 className="font-display mt-6 text-4xl font-bold leading-[1.1] text-bark-deep sm:text-5xl lg:text-6xl">
            {t.hero.title[lang]}
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-bark/75 lg:mx-0">
            {t.hero.subtitle[lang]}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <a
              href="#honey"
              className="rounded-full bg-gradient-to-br from-honey to-amber px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-honey/30 transition-transform hover:scale-105"
            >
              {t.hero.ctaPrimary[lang]}
            </a>
            <a
              href="#equipment"
              className="rounded-full border border-bark/20 bg-white/70 px-7 py-3 text-sm font-semibold text-bark transition-colors hover:border-honey hover:text-amber"
            >
              {t.hero.ctaSecondary[lang]}
            </a>
          </div>

          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 text-center lg:mx-0 lg:text-start">
            {[
              { v: "15+", k: t.hero.stat1[lang] },
              { v: "20+", k: t.hero.stat2[lang] },
              { v: "100%", k: t.hero.stat3[lang] },
            ].map((s) => (
              <div key={s.k}>
                <dt className="font-display text-2xl font-bold text-amber sm:text-3xl">
                  {s.v}
                </dt>
                <dd className="mt-1 text-xs font-medium text-bark/70">{s.k}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="rounded-[2rem] border border-bark/10 bg-white/40 p-3 shadow-2xl backdrop-blur-sm">
            <ShuffleGrid />
          </div>
          <div className="absolute -bottom-5 -start-4 flex items-center gap-3 rounded-2xl border border-bark/10 bg-white/90 px-4 py-3 shadow-xl backdrop-blur">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-honey/15 text-amber">
              <Honeycomb className="h-6 w-6" stroke="currentColor" />
            </span>
            <div className="text-start">
              <p className="text-sm font-bold text-bark-deep">
                {lang === "ar" ? "خام وطبيعي" : "Raw & Natural"}
              </p>
              <p className="text-xs text-bark/60">
                {lang === "ar" ? "بلا إضافات" : "No additives"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
