"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLang } from "@/components/LanguageProvider";
import { t } from "@/lib/translations";
import { SafeImage } from "@/components/SafeImage";
import { Bee, Honeycomb, Icon } from "@/components/icons";
import { useCatalog } from "@/components/CatalogProvider";
import type { IconName } from "@/components/icons";
import { photoUrl, pickText } from "@/lib/catalog-types";

type Tile = { id: string; src?: string; alt?: string; icon: IconName };

const ICON_CYCLE: IconName[] = ["HoneyJar", "Bee", "Honeycomb", "Drop", "Hive"];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ShuffleGrid() {
  const { lang } = useLang();
  const { products } = useCatalog();
  // Product photos uploaded in the admin first, then icon tiles to fill 4×4.
  const tiles = useMemo<Tile[]>(() => {
    const photos = products.filter((p) => p.photo).slice(0, 16);
    return Array.from({ length: 16 }, (_, i) =>
      photos[i]
        ? {
            id: photos[i].id,
            src: photoUrl(photos[i].photo!, "sm"),
            alt: pickText(photos[i].name, lang),
            icon: ICON_CYCLE[i % ICON_CYCLE.length],
          }
        : { id: `icon-${i}`, icon: ICON_CYCLE[i % ICON_CYCLE.length] },
    );
  }, [products, lang]);
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
  }, [tiles]);

  return (
    <div className="grid grid-cols-4 grid-rows-4 gap-2 h-[340px] sm:h-[440px] lg:h-[500px]">
      {order.map((tile) => (
        <motion.div
          key={tile.id}
          layout
          transition={{ duration: 1.4, type: "spring" }}
          className="h-full w-full"
        >
          {tile.src ? (
            <SafeImage
              src={tile.src}
              alt={tile.alt ?? ""}
              icon={tile.icon}
              className="h-full w-full rounded-lg shadow-sm"
            />
          ) : (
            <div className="relative grid h-full w-full place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-honey-light via-honey to-amber shadow-sm">
              <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle,rgba(255,255,255,.9)_1px,transparent_1.4px)] [background-size:16px_16px]" />
              <Icon
                name={tile.icon}
                className="relative h-1/3 w-1/3 text-white/95"
                stroke="currentColor"
              />
            </div>
          )}
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
