"use client";

import { BeeCanvas } from "@/components/BeeCanvas";
import { useLang } from "@/components/LanguageProvider";
import { SectionHeading } from "@/components/SectionHeading";
import { CASTES, LIFE_STAGES, SOURCES, type LifeStage } from "@/lib/life-cycle";
import { t } from "@/lib/translations";
import { useScrollFlight } from "@/components/bee3d/use-scroll-flight";

/** A point with no size on the timeline; children are centred on it (same in RTL). */
const ON_LINE = "absolute start-12 h-0 w-0 lg:start-1/2";
const CENTRED = "absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2";

const arabicDigits = (s: string) => s.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]);

/** "The life of a honey bee": four stages; a 3D bee flies along with the scroll. */
export function BeeLifeCycle() {
  const { lang } = useLang();
  const l = t.life;
  const { track, marker, trail, steps, flight, active, reached } = useScrollFlight(LIFE_STAGES.length);
  const num = (n: number) => (lang === "ar" ? arabicDigits(String(n)) : String(n));

  return (
    <section id="life-cycle" className="relative overflow-hidden bg-cream py-20 sm:py-28">
      <div className="pointer-events-none absolute -top-32 start-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-honey/15 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow={l.eyebrow[lang]} title={l.title[lang]} subtitle={l.subtitle[lang]} />

        <div ref={track} className="relative mt-20 lg:mt-28">
          <div className={`${ON_LINE} inset-y-0`} aria-hidden="true">
            <div className="absolute inset-y-0 left-0 w-px -translate-x-1/2 bg-bark/15" />
            <div ref={trail} className="absolute left-0 top-0 w-0.5 -translate-x-1/2 rounded-full bg-gradient-to-b from-honey-light to-amber" />
          </div>
          {/* The bee: placed by the scroll (components/bee3d/use-scroll-flight.ts), drawn in 3D. */}
          <div className={`${ON_LINE} top-0 z-20`} aria-hidden="true">
            <div ref={marker} className="absolute left-0 top-0 will-change-transform">
              <BeeCanvas flight={flight} className={`${CENTRED} pointer-events-none h-[74px] w-[88px] lg:h-[200px] lg:w-[240px]`} />
            </div>
          </div>

          <ol className="space-y-16 lg:space-y-36">
            {LIFE_STAGES.map((stage, i) => (
              <li
                key={stage.id}
                ref={(el) => {
                  steps.current[i] = el;
                }}
                className="relative ps-24 lg:ps-0"
              >
                <span className={`${ON_LINE} top-8 z-10 lg:top-1/2`} aria-hidden="true">
                  <span
                    className={`${CENTRED} grid h-10 w-10 place-items-center rounded-full border text-sm font-bold transition-all duration-700 ${
                      i <= reached ? "scale-100 border-amber bg-bark-deep text-honey-light shadow-lg" : "scale-75 border-bark/20 bg-cream text-bark/40"
                    }`}
                  >
                    {num(i + 1)}
                  </span>
                </span>
                <Stage stage={stage} index={i} shown={i <= reached} current={i === active} />
              </li>
            ))}
          </ol>
        </div>

        <Castes />

        <footer className="mt-12 border-t border-bark/10 pt-6 text-xs leading-relaxed text-bark/60">
          <p>{l.approx[lang]}</p>
          <p className="mt-2">
            <span className="font-semibold text-bark/80">{l.sources[lang]}: </span>
            {SOURCES.map((s, i) => (
              <span key={s.url} dir="ltr">
                {i > 0 && " · "}
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline decoration-bark/30 underline-offset-2 hover:text-amber">
                  {s.label}
                </a>
              </span>
            ))}
          </p>
        </footer>
      </div>
    </section>
  );
}

function Stage({ stage, index, shown, current }: { stage: LifeStage; index: number; shown: boolean; current: boolean }) {
  const { lang } = useLang();
  const l = t.life;
  const num = lang === "ar" ? arabicDigits(String(index + 1)) : String(index + 1);
  const flip = index % 2 === 1; // odd stages: text first, photo second
  const reveal = "transition-all duration-1000 ease-out motion-reduce:transition-none";

  return (
    <article className="grid items-center gap-7 lg:grid-cols-2 lg:gap-72">
      <figure className={`${reveal} ${flip ? "lg:order-2" : ""} ${shown ? "translate-y-0 scale-100 opacity-100" : "translate-y-8 scale-95 opacity-0"}`}>
        <div className={`overflow-hidden rounded-2xl bg-bark-deep shadow-xl ring-1 transition-shadow duration-700 ${current ? "shadow-honey/30 ring-honey/60" : "ring-bark/10"}`}>
          {/* Pre-sized WebP served from public/: no image service needed. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={stage.photo.src}
            width={stage.photo.width}
            height={stage.photo.height}
            alt={stage.photo.alt[lang]}
            loading="lazy"
            decoding="async"
            className="block aspect-[4/3] w-full object-cover"
          />
        </div>
        <figcaption className="mt-3 text-xs leading-relaxed text-bark/60">
          {stage.photo.caption[lang]}{" "}
          <a href={stage.photo.source} target="_blank" rel="noopener noreferrer" className="underline decoration-bark/30 underline-offset-2 hover:text-amber">
            {l.photoBy[lang].replace("{a}", stage.photo.author).replace("{l}", stage.photo.license)}
          </a>
        </figcaption>
      </figure>

      <div className={`${reveal} delay-150 ${flip ? "lg:order-1" : ""} ${shown ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber">
          <span>{l.stage[lang].replace("{n}", num)}</span>
          <span className="h-px w-8 bg-honey/60" aria-hidden="true" />
          <span className="text-bark/60">{stage.days[lang]}</span>
        </p>
        <h3 className="font-display mt-3 text-3xl font-bold text-bark-deep sm:text-4xl">{stage.title[lang]}</h3>
        <div className="mt-4 space-y-3 text-base leading-relaxed text-bark/75">
          {stage.paragraphs.map((p, i) => (
            <p key={i}>{p[lang]}</p>
          ))}
        </div>
        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <dt className="mt-0.5 text-lg leading-none" aria-hidden="true">⏱</dt>
            <dd className="font-semibold text-bark-deep">{stage.duration[lang]}</dd>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-leaf/25 bg-leaf/10 px-4 py-3">
            <dt className="shrink-0 font-semibold text-leaf">{l.factLabel[lang]}</dt>
            <dd className="text-bark-deep">{stage.fact[lang]}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

function Castes() {
  const { lang } = useLang();
  const l = t.life;
  const longest = Math.max(...CASTES.map((c) => c.days));
  return (
    <div className="mt-24 rounded-3xl border border-bark/10 bg-white/80 p-6 shadow-sm sm:p-10 lg:mt-36">
      <h3 className="font-display text-center text-2xl font-bold text-bark-deep">{l.castesTitle[lang]}</h3>
      <ul className="mt-8 space-y-6">
        {CASTES.map((c) => (
          <li key={c.name.en} className="grid items-center gap-x-5 gap-y-2 sm:grid-cols-[11rem_1fr]">
            <p className="flex items-center gap-3">
              <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-full bg-honey/15 text-lg">{c.icon}</span>
              <span>
                <span className="font-display block font-semibold text-bark-deep">{c.name[lang]}</span>
                <span className="block text-xs text-bark/60">{c.role[lang]}</span>
              </span>
            </p>
            <div>
              <div className="h-3 overflow-hidden rounded-full bg-bark/10">
                <div className="h-full rounded-full bg-gradient-to-r from-honey-light to-amber rtl:bg-gradient-to-l" style={{ width: `${(c.days / longest) * 100}%` }} />
              </div>
              <p className="mt-1.5 flex flex-wrap justify-between gap-x-4 text-xs text-bark/60">
                <span className="font-semibold text-bark-deep">
                  ≈ {lang === "ar" ? arabicDigits(String(c.days)) : c.days} {l.daysUnit[lang]}
                </span>
                <span>{c.split[lang]}</span>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
