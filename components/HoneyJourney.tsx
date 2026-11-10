"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { JourneyArt } from "@/components/JourneyArt";
import { useLang } from "@/components/LanguageProvider";
import { SectionHeading } from "@/components/SectionHeading";
import { t } from "@/lib/translations";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
/** A point with no size on the flight line; children are centred on it (same in RTL). */
const ON_LINE = "absolute start-6 h-0 w-0 lg:start-1/2";
const CENTRED = "absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2";

/** "How bees make honey": six steps along a line that fills with the scroll. */
export function HoneyJourney() {
  const { lang } = useLang();
  const j = t.journey;
  const track = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const steps = useRef<(HTMLLIElement | null)[]>([]);
  const [active, setActive] = useState(-1);
  const [reached, setReached] = useState(-1);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = track.current;
      if (!el || !fill.current) return;
      const rect = el.getBoundingClientRect();
      // The line fills up to mid-screen while the steps scroll past.
      const p = clamp((window.innerHeight * 0.5 - rect.top) / rect.height, 0, 1);
      const y = p * rect.height;
      fill.current.style.height = `${y}px`;
      let near = -1;
      steps.current.forEach((li, i) => {
        if (li && y >= li.offsetTop + li.offsetHeight * 0.25) near = i;
      });
      setActive(near);
      setReached((r) => Math.max(r, near));
    };
    const onScroll = () => {
      frame ||= requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [j.steps.length]);

  const num = (n: number) => (lang === "ar" ? "٠١٢٣٤٥٦٧٨٩"[n] : String(n));

  return (
    <section id="journey" className="honeycomb-bg relative overflow-hidden py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow={j.eyebrow[lang]} title={j.title[lang]} subtitle={j.subtitle[lang]} />

        <div ref={track} className="relative mt-16 lg:mt-24">
          {/* Flight line: dashed, filled with honey behind the bee. */}
          <div className={`${ON_LINE} inset-y-0`} aria-hidden="true">
            <div className="absolute inset-y-0 left-0 -translate-x-1/2 border-s-2 border-dashed border-honey/40" />
            <div ref={fill} className="absolute left-0 top-0 w-1 -translate-x-1/2 rounded-full bg-gradient-to-b from-honey-light to-amber" />
          </div>
          <ol className="space-y-14 lg:space-y-28">
            {j.steps.map((s, i) => {
              const on = i <= reached;
              return (
                <li
                  key={i}
                  ref={(el) => {
                    steps.current[i] = el;
                  }}
                  className="relative ps-14 lg:ps-0"
                >
                  {/* Marker on the line. */}
                  <span className={`${ON_LINE} top-1/2 z-10`} aria-hidden="true">
                    <span
                      className={`${CENTRED} grid h-9 w-9 place-items-center rounded-full border-2 text-sm font-bold shadow-sm transition-colors duration-500 ${
                        on ? "border-amber bg-gradient-to-br from-honey to-amber text-white" : "border-honey/40 bg-cream text-bark/50"
                      }`}
                    >
                      {num(i + 1)}
                    </span>
                  </span>

                  <div
                    className={`grid items-center gap-6 transition-all duration-700 ease-out motion-reduce:transition-none lg:grid-cols-2 lg:gap-52 ${
                      on ? "translate-y-0 opacity-100" : "translate-y-6 opacity-50"
                    }`}
                  >
                    <figure
                      className={`overflow-hidden rounded-3xl border bg-white shadow-lg ring-1 ring-bark/5 transition-shadow duration-500 ${
                        i === active ? "border-honey shadow-honey/30" : "border-bark/10"
                      } ${i % 2 ? "lg:order-2" : ""}`}
                    >
                      <JourneyArt step={i} className="block aspect-[16/10] w-full" />
                    </figure>
                    <div className={i % 2 ? "lg:order-1 lg:text-end" : ""}>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber">
                        {j.stepLabel[lang].replace("{n}", num(i + 1))}
                      </p>
                      <h3 className="font-display mt-2 text-2xl font-bold text-bark-deep sm:text-3xl">{s.title[lang]}</h3>
                      <p className="mt-3 text-base leading-relaxed text-bark/75">{s.text[lang]}</p>
                      <p className="mt-4 inline-flex items-start gap-2 rounded-2xl border border-honey/30 bg-honey/10 px-4 py-2.5 text-start text-sm text-bark-deep">
                        <span aria-hidden="true">💡</span>
                        <span>
                          <strong className="font-semibold">{j.factLabel[lang]}</strong> {s.fact[lang]}
                        </span>
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <dl className="mt-20 grid gap-4 sm:grid-cols-3 lg:mt-28">
          {j.stats.map((st, i) => (
            <div key={i} className="rounded-3xl border border-honey/30 bg-white/80 p-6 text-center shadow-sm backdrop-blur">
              <dt className="sr-only">{st.label[lang]}</dt>
              <dd>
                <span className="font-display block bg-gradient-to-br from-honey to-amber bg-clip-text text-4xl font-bold text-transparent" dir="ltr">
                  {st.value[lang]}
                </span>
                <span className="mt-2 block text-sm leading-relaxed text-bark/70">{st.label[lang]}</span>
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-12 text-center">
          <Link
            href="/shop#honey"
            className="inline-block rounded-full bg-gradient-to-br from-honey to-amber px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-honey/30 transition-transform hover:scale-105"
          >
            🍯 {j.cta[lang]}
          </Link>
        </p>
      </div>
    </section>
  );
}
