"use client";

import Link from "next/link";
import { useLang } from "@/components/LanguageProvider";
import { t } from "@/lib/translations";
import { pickText } from "@/lib/catalog-types";
import type { Lot } from "@/lib/lot-types";

/** One lot's facts: harvest, origin, notes, lab analysis. */
export function LotFacts({ lot }: { lot: Lot }) {
  const { lang } = useLang();
  const l = t.lots;
  const region = pickText(lot.region, lang);
  const notes = pickText(lot.notes, lang);
  return (
    <div className="space-y-1.5 text-sm text-bark/80">
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        {lot.harvestOn && (
          <>
            <dt className="font-medium text-bark">{l.harvest[lang]}</dt>
            <dd dir="ltr" className="text-start">{lot.harvestOn}</dd>
          </>
        )}
        {region && (
          <>
            <dt className="font-medium text-bark">{l.region[lang]}</dt>
            <dd>{region}</dd>
          </>
        )}
      </dl>
      {notes && <p className="whitespace-pre-line text-bark/70">{notes}</p>}
      {lot.certificateUrl && (
        <a
          href={lot.certificateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-bark/15 bg-white px-3 py-1.5 text-xs font-semibold text-bark hover:border-honey hover:text-amber"
        >
          📄 {l.analysis[lang]}
        </a>
      )}
    </div>
  );
}

/** Traceability block on a product page: its current lots. */
export function ProductLots({ lots }: { lots: Lot[] }) {
  const { lang } = useLang();
  const l = t.lots;
  if (lots.length === 0) return null;
  return (
    <section aria-labelledby="lots-title" className="mt-14">
      <h2 id="lots-title" className="font-display text-2xl font-bold text-bark-deep">
        🔍 {l.title[lang]}
      </h2>
      <p className="mt-1 text-sm text-bark/60">
        {l.intro[lang]}{" "}
        <Link href="/lot" className="font-semibold text-amber hover:text-bark">{l.footerLink[lang]} →</Link>
      </p>
      <ul className="mt-5 grid gap-4 md:grid-cols-2">
        {lots.map((lot) => (
          <li key={lot.id} className="rounded-2xl border border-bark/10 bg-white p-5">
            <p className="mb-2 font-semibold text-bark-deep">
              {l.lot[lang].replace("{c}", "")}
              <span className="font-mono" dir="ltr">{lot.code}</span>
            </p>
            <LotFacts lot={lot} />
          </li>
        ))}
      </ul>
    </section>
  );
}
