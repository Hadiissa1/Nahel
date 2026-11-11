"use client";

import { BeeCanvas } from "@/components/BeeCanvas";
import { useStoryScroll } from "@/components/bee3d/use-story-scroll";
import { useLang } from "@/components/LanguageProvider";
import { CASTES, LIFE_STAGES, SOURCES } from "@/lib/life-cycle";
import { t } from "@/lib/translations";

const arabicDigits = (s: string) => s.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]);
const INK = "bg-[#0d0a06]";

/**
 * "The life of a honey bee" as a pinned scroll story: the screen stays in
 * place while the visitor scrolls; the 3D bee, the photograph and the text
 * move from egg to adult at the visitor's pace.
 */
export function BeeLifeCycle() {
  const { lang } = useLang();
  const l = t.life;
  const { story, stage, bee, halo, bar, flight, scene } = useStoryScroll(LIFE_STAGES.length);
  const digits = (n: number | string) => (lang === "ar" ? arabicDigits(String(n)) : String(n));
  const pad = (n: number) => digits(String(n).padStart(2, "0"));
  // Scenes are stacked; only the current one is visible (and read aloud).
  const layer = (on: boolean) =>
    `transition-all duration-700 ease-out motion-reduce:transition-none ${on ? "opacity-100" : "pointer-events-none opacity-0"}`;

  return (
    <section id="life-cycle" className={`${INK} text-cream`}>
      {/* Opening */}
      <div className="relative grid min-h-[70vh] place-items-center overflow-hidden px-6 pb-16 pt-28 text-center">
        <div className="pointer-events-none absolute -start-[20%] top-[-10%] h-[70vw] max-h-[820px] w-[70vw] max-w-[820px] rounded-full border border-honey/15" />
        <div className="pointer-events-none absolute -end-[15%] bottom-[-30%] h-[55vw] max-h-[640px] w-[55vw] max-w-[640px] rounded-full border border-cream/10" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-honey-light">{l.eyebrow[lang]}</p>
          <h2 className="font-display mx-auto mt-6 max-w-4xl text-5xl font-bold leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
            {l.title[lang]}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-cream/60 sm:text-lg">{l.subtitle[lang]}</p>
          <p className="mt-12 text-xs uppercase tracking-[0.12em] text-cream/50">
            {l.hint[lang]}
            <span aria-hidden="true" className="mt-2 block animate-bounce text-xl text-honey-light motion-reduce:animate-none">↓</span>
          </p>
        </div>
      </div>

      {/* Pinned story: one screen high, scrolled through over four screens. */}
      <div ref={story} className="relative h-[440vh]">
        <div className="sticky top-0 grid h-[100svh] grid-rows-[auto_1fr] items-center gap-x-[4vw] gap-y-3 overflow-clip px-5 pb-4 pt-[4.75rem] [background:radial-gradient(ellipse_at_66%_48%,#2a1c0b_0%,#140e07_40%,#0d0a06_74%)] sm:px-[6vw] lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)] lg:grid-rows-1 lg:px-[8vw] lg:pt-24">
          <div ref={bar} className="absolute inset-x-0 top-16 z-10 h-[3px] origin-left bg-honey-light shadow-[0_0_18px_rgba(240,183,64,0.6)] rtl:origin-right" style={{ transform: "scaleX(0)" }} aria-hidden="true" />

          {/* Text of the current stage */}
          <div className="relative z-[2] grid max-w-xl">
            {LIFE_STAGES.map((s, i) => (
              <article key={s.id} aria-hidden={i !== scene} className={`col-start-1 row-start-1 ${layer(i === scene)} ${i === scene ? "translate-y-0" : "translate-y-4"}`}>
                <p className="flex items-center gap-2.5 text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-honey-light">
                  <span className="h-px w-7 bg-honey-light" aria-hidden="true" />
                  {l.stage[lang].replace("{n}", pad(i + 1)).replace("{t}", pad(LIFE_STAGES.length))}
                  <span className="font-semibold text-cream/50">· {s.days[lang]}</span>
                </p>
                <h3 className="font-display mt-2 text-3xl font-bold leading-none tracking-tight sm:text-5xl lg:mt-5 lg:text-7xl">{s.title[lang]}</h3>
                <div className="mt-2 space-y-2.5 text-[13px] leading-snug text-cream/65 sm:text-sm sm:leading-relaxed lg:mt-5 lg:text-base">
                  {s.paragraphs.map((p, k) => (
                    // Phones show the first paragraph; larger screens show them all.
                    <p key={k} className={k > 0 ? "hidden lg:block" : ""}>{p[lang]}</p>
                  ))}
                </div>
                <dl className="mt-2 space-y-1.5 text-[13px] sm:text-sm lg:mt-5 lg:space-y-2">
                  <div className="flex items-start gap-2.5">
                    <dt aria-hidden="true">⏱</dt>
                    <dd className="font-semibold text-cream">{s.duration[lang]}</dd>
                  </div>
                  <div className="flex items-start gap-2.5 rounded-2xl border border-honey/25 bg-honey/10 px-3 py-1.5 lg:px-4 lg:py-2.5">
                    <dt className="shrink-0 font-semibold text-honey-light">{l.factLabel[lang]}</dt>
                    <dd className="text-cream/85">{s.fact[lang]}</dd>
                  </div>
                </dl>
              </article>
            ))}
            <div className="mt-3 flex gap-2 lg:mt-8" aria-hidden="true">
              {LIFE_STAGES.map((s, i) => (
                <i key={s.id} className={`block h-[3px] w-9 rounded-full transition-colors duration-300 ${i === scene ? "bg-honey-light" : "bg-cream/20"}`} />
              ))}
            </div>
          </div>

          {/* The stage: photograph of the current step, with the bee flying over it. */}
          <div ref={stage} className="relative z-[2] grid min-h-0 place-items-center self-stretch">
            <div ref={halo} className="pointer-events-none absolute aspect-square w-[min(80vw,560px)] rounded-full [background:radial-gradient(circle,rgba(240,183,64,0.16),transparent_66%)]" aria-hidden="true" />
            <div className="relative grid w-[min(74vw,440px)] lg:w-[min(36vw,480px)]">
              {LIFE_STAGES.map((s, i) => (
                <figure key={s.id} aria-hidden={i !== scene} className={`col-start-1 row-start-1 ${layer(i === scene)} ${i === scene ? "scale-100" : "scale-95"}`}>
                  <div className="overflow-hidden rounded-[28px] bg-black shadow-[0_45px_100px_rgba(0,0,0,0.7)] ring-1 ring-cream/25">
                    {/* Pre-sized WebP served from public/: no image service needed. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.photo.src}
                      width={s.photo.width}
                      height={s.photo.height}
                      alt={s.photo.alt[lang]}
                      loading="lazy"
                      decoding="async"
                      className="block aspect-[4/3] max-h-[27svh] w-full object-cover [@media(min-height:760px)]:max-h-[36svh] lg:!max-h-none"
                    />
                  </div>
                  <figcaption className="mt-1.5 text-[10px] leading-snug text-cream/50 sm:text-[11px] lg:mt-2.5">
                    {s.photo.caption[lang]}{" "}
                    <a
                      href={s.photo.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      tabIndex={i === scene ? 0 : -1}
                      className="underline decoration-cream/30 underline-offset-2 hover:text-honey-light"
                    >
                      {l.photoBy[lang].replace("{a}", s.photo.author).replace("{l}", s.photo.license)}
                    </a>
                  </figcaption>
                </figure>
              ))}
            </div>
            {/* The bee: placed by the scroll (use-story-scroll.ts), drawn in 3D. */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-0 w-0" aria-hidden="true">
              <div ref={bee} className="absolute left-0 top-0 will-change-transform">
                <BeeCanvas flight={flight} className="absolute left-0 top-0 h-[100px] w-[120px] -translate-x-1/2 -translate-y-1/2 sm:h-[130px] sm:w-[156px] lg:h-[250px] lg:w-[300px]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* After the story: the three castes, the caveat and the sources. */}
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-honey-light">{l.eyebrow[lang]}</p>
        <h3 className="font-display mt-4 text-center text-3xl font-bold tracking-tight sm:text-5xl">{l.castesTitle[lang]}</h3>
        <ul className="mt-12 space-y-7">
          {CASTES.map((c) => (
            <li key={c.name.en} className="grid items-center gap-x-6 gap-y-2 sm:grid-cols-[12rem_1fr]">
              <p className="flex items-center gap-3">
                <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-full border border-honey/30 bg-honey/10 text-lg">{c.icon}</span>
                <span>
                  <span className="font-display block text-lg font-semibold">{c.name[lang]}</span>
                  <span className="block text-xs text-cream/50">{c.role[lang]}</span>
                </span>
              </p>
              <div>
                <div className="h-[3px] overflow-hidden rounded-full bg-cream/15">
                  <div className="h-full rounded-full bg-honey-light" style={{ width: `${(c.days / 24) * 100}%` }} />
                </div>
                <p className="mt-2 flex flex-wrap justify-between gap-x-4 text-xs text-cream/50">
                  <span className="text-base font-bold text-cream">
                    ≈ {digits(c.days)} {l.daysUnit[lang]}
                  </span>
                  <span>{c.split[lang]}</span>
                </p>
              </div>
            </li>
          ))}
        </ul>
        <footer className="mt-14 border-t border-cream/10 pt-6 text-xs leading-relaxed text-cream/45">
          <p>{l.approx[lang]}</p>
          <p className="mt-2">
            <span className="font-semibold text-cream/70">{l.sources[lang]}: </span>
            {SOURCES.map((s, i) => (
              <span key={s.url} dir="ltr">
                {i > 0 && " · "}
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline decoration-cream/30 underline-offset-2 hover:text-honey-light">
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
