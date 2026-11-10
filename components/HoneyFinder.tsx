"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCatalog } from "@/components/CatalogProvider";
import { useLang } from "@/components/LanguageProvider";
import { ProductCard } from "@/components/ProductCard";
import { SectionHeading } from "@/components/SectionHeading";
import { t } from "@/lib/translations";
import type { CatalogProduct } from "@/lib/catalog-types";

/**
 * What each starter honey is like, per question. Honeys the owner adds later
 * have no entry: they score 0 and are only suggested when nothing else is left.
 */
const TRAITS: Record<string, string[]> = {
  oak: ["rich", "wellness", "breakfast", "lebanon"],
  lemon: ["floral", "tea", "breakfast", "lebanon"],
  eucalyptus: ["rich", "wellness", "tea"],
  jardi: ["floral", "breakfast", "gift", "lebanon"],
  baraka: ["rich", "wellness", "egypt"],
  "sidr-egy": ["rich", "gift", "wellness", "egypt"],
  "sidr-kashmir": ["rich", "gift"],
  clover: ["mild", "tea", "breakfast", "egypt"],
  thyme: ["floral", "wellness", "tea", "egypt"],
  comb: ["mild", "gift", "breakfast"],
};

/** The honey that matches the most answers (earlier answers break ties). */
export function pickHoney(honeys: CatalogProduct[], answers: string[]): CatalogProduct | undefined {
  let best: CatalogProduct | undefined;
  let bestScore = -1;
  for (const p of honeys) {
    const traits = TRAITS[p.id] ?? [];
    const score = answers.reduce((s, a, i) => s + (a === "any" || traits.includes(a) ? 4 - i : 0), 0);
    if (score > bestScore) {
      best = p;
      bestScore = score;
    }
  }
  return best;
}

const HEX = "[clip-path:polygon(25%_3%,75%_3%,100%_50%,75%_97%,25%_97%,0_50%)]";

/** Home page game: three choices on a honeycomb, then a recommended honey. */
export function HoneyFinder() {
  const { lang } = useLang();
  const { products } = useCatalog();
  const honeys = useMemo(() => products.filter((p) => p.category === "honey"), [products]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const f = t.finder;
  const done = answers.length === f.questions.length;
  const pick = useMemo(() => (done ? pickHoney(honeys, answers) : undefined), [done, honeys, answers]);

  // A short "the bees are choosing" pause before the result.
  useEffect(() => {
    if (!done) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => setRevealed(true), reduce ? 0 : 1400);
    return () => clearTimeout(timer);
  }, [done]);

  if (honeys.length === 0) return null;

  const go = (next: string[]) => {
    setRevealed(false);
    setAnswers(next);
    // Keyboard and screen-reader users follow to the new question.
    requestAnimationFrame(() => heading.current?.focus());
  };
  const step = Math.min(answers.length, f.questions.length - 1);
  const question = f.questions[step];
  const labelOf = (i: number, id: string) => f.questions[i].options.find((o) => o.id === id)?.label[lang] ?? "";

  return (
    <section id="finder" className="honeycomb-bg relative overflow-hidden py-20 sm:py-24">
      <div className="pointer-events-none absolute -top-24 start-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-honey/20 blur-3xl" />
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeading eyebrow={f.eyebrow[lang]} title={f.title[lang]} subtitle={f.subtitle[lang]} />

        {/* Progress: one cell fills with honey per answer. */}
        <ol className="mt-8 flex justify-center gap-2" aria-hidden="true">
          {f.questions.map((_, i) => (
            <li key={i} className={`relative h-9 w-10 overflow-hidden bg-bark/15 ${HEX}`}>
              <span
                className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-amber to-honey-light transition-[height] duration-700 ease-out motion-reduce:transition-none ${
                  i < answers.length ? "h-full" : "h-0"
                }`}
              />
            </li>
          ))}
        </ol>

        <div className="mt-8 rounded-3xl border border-honey/30 bg-white/75 p-6 shadow-sm backdrop-blur sm:p-10" aria-live="polite">
          {!done && (
            <div key={step} className="animate-fade-up">
              <p className="text-center text-xs font-semibold uppercase tracking-wider text-amber">
                {f.step[lang].replace("{n}", lang === "ar" ? "١٢٣"[step] : String(step + 1))}
              </p>
              <h3
                ref={heading}
                tabIndex={-1}
                className="font-display mt-2 text-center text-2xl font-bold text-bark-deep outline-none"
              >
                {question.title[lang]}
              </h3>
              <ul className="mt-8 flex flex-wrap justify-center gap-x-3 gap-y-4 sm:gap-x-5">
                {question.options.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => go([...answers, o.id])}
                      className="group block rounded-2xl outline-none drop-shadow-sm transition-transform duration-200 hover:-translate-y-1 focus-visible:-translate-y-1 active:scale-95 motion-reduce:transition-none"
                    >
                      {/* Outer hexagon = border, inner = cell. */}
                      <span className={`block bg-honey p-[3px] transition-colors group-hover:bg-amber group-focus-visible:bg-bark-deep ${HEX}`}>
                        <span
                          className={`flex h-28 w-32 flex-col items-center justify-center gap-1 bg-cream px-5 text-center transition-colors group-hover:bg-honey-light/40 group-focus-visible:bg-honey-light/40 sm:h-36 sm:w-40 ${HEX}`}
                        >
                          <span aria-hidden="true" className="text-3xl transition-transform duration-300 group-hover:scale-125 motion-reduce:transition-none">
                            {o.icon}
                          </span>
                          <span className="text-sm font-semibold leading-tight text-bark-deep">{o.label[lang]}</span>
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {step > 0 && (
                <p className="mt-8 text-center">
                  <button
                    type="button"
                    onClick={() => go(answers.slice(0, -1))}
                    className="text-sm font-medium text-bark/60 underline-offset-4 hover:text-amber hover:underline"
                  >
                    {f.back[lang]}
                  </button>
                </p>
              )}
            </div>
          )}

          {done && !revealed && (
            <div className="flex flex-col items-center gap-5 py-10" role="status">
              <span aria-hidden="true" className="animate-bee text-5xl">🐝</span>
              <p className="font-display text-lg font-semibold text-bark-deep">{f.working[lang]}</p>
            </div>
          )}

          {done && revealed && pick && (
            <div className="animate-fade-up">
              <h3
                ref={heading}
                tabIndex={-1}
                className="font-display text-center text-2xl font-bold text-bark-deep outline-none"
              >
                {f.resultTitle[lang]}
              </h3>
              <p className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-bark/70">
                <span>{f.because[lang]}</span>
                {answers.map((a, i) => (
                  <span key={i} className="rounded-full border border-honey/40 bg-honey/10 px-3 py-1 font-medium text-bark-deep">
                    {labelOf(i, a)}
                  </span>
                ))}
              </p>
              <div className="mx-auto mt-6 flex w-full max-w-xs [&>article]:w-full">
                <ProductCard key={pick.id} product={pick} />
              </div>
              <p className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => go([])}
                  className="rounded-full border border-bark/20 bg-white px-5 py-2 text-bark transition-colors hover:border-honey hover:text-amber"
                >
                  ↻ {f.restart[lang]}
                </button>
                <a href="#shop" className="text-amber underline-offset-4 hover:underline">
                  {f.seeAll[lang]}
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
