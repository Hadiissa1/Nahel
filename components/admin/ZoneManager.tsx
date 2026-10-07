"use client";

import { startTransition, useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import { deleteZoneAction, saveZoneAction, type ZoneState } from "@/app/admin/actions";
import { a } from "@/lib/admin-i18n";
import type { AdminZone } from "@/lib/delivery-types";

const cents = (v: number | null) => (v === null ? "" : (v / 100).toString());

export function ZoneManager({ zones }: { zones: AdminZone[] }) {
  const { lang } = useLang();
  const [added, setAdded] = useState(0);
  const z = a.zones;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-bark-deep">{z.title[lang]}</h1>
        <p className="mt-2 rounded-xl bg-honey/10 px-4 py-2.5 text-xs text-bark/70">{z.intro[lang]}</p>
      </div>

      {zones.length === 0 ? (
        <p className="text-sm text-bark/60">{z.empty[lang]}</p>
      ) : (
        <ul className="space-y-3">
          {zones.map((zone) => (
            <li key={zone.id}>
              <ZoneForm zone={zone} />
            </li>
          ))}
        </ul>
      )}

      <section>
        <h2 className="mb-2 font-display text-lg font-bold text-bark-deep">{z.newTitle[lang]}</h2>
        {/* Remounted after each addition so the fields start empty again. */}
        <ZoneForm key={added} onSaved={() => setAdded((n) => n + 1)} />
      </section>
    </div>
  );
}

function ZoneForm({ zone, onSaved }: { zone?: AdminZone; onSaved?: () => void }) {
  const { lang } = useLang();
  const router = useRouter();
  const [state, dispatch, saving] = useActionState<ZoneState, FormData>(async (prev, fd) => {
    const r = await saveZoneAction(prev, fd);
    if (r.saved && onSaved) onSaved();
    return r;
  }, {});
  const [deleting, startDelete] = useTransition();
  const [failed, setFailed] = useState(false);
  const z = a.zones;
  const errors = state.errors ?? {};
  const err = (f: string) => (errors[f] ? (a.errors[errors[f]!] ?? a.errors.invalid)[lang] : null);
  const field = (f: string) =>
    `mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm text-bark outline-none focus:border-honey focus:ring-2 focus:ring-honey/30 ${
      errors[f] ? "border-red-400" : "border-bark/15"
    }`;
  const label = "block text-[11px] font-medium text-bark/70";
  const p = zone?.id ?? "new";

  return (
    <form
      // onSubmit (not action=) so React doesn't clear the fields when there are errors.
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => dispatch(fd));
      }}
      noValidate
      aria-label={zone ? zone.name[lang] || zone.name.ar || zone.name.en : z.newTitle[lang]}
      className="rounded-2xl border border-bark/10 bg-white p-4"
    >
      <input type="hidden" name="id" value={zone?.id ?? ""} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-[1.3fr_1.3fr_0.8fr_0.8fr_auto] lg:items-start">
        <div>
          <label htmlFor={`${p}-ar`} className={label}>{z.nameAr[lang]}</label>
          <input id={`${p}-ar`} name="name_ar" defaultValue={zone?.name.ar} maxLength={60} dir="rtl" className={field("name_ar")} />
          {err("name_ar") && <p className="mt-1 text-[11px] text-red-700">{err("name_ar")}</p>}
        </div>
        <div>
          <label htmlFor={`${p}-en`} className={label}>{z.nameEn[lang]}</label>
          <input id={`${p}-en`} name="name_en" defaultValue={zone?.name.en} maxLength={60} dir="ltr" className={field("name_en")} />
          {err("name_en") && <p className="mt-1 text-[11px] text-red-700">{err("name_en")}</p>}
        </div>
        <div>
          <label htmlFor={`${p}-fee`} className={label}>{z.fee[lang]}</label>
          <input
            id={`${p}-fee`}
            name="fee"
            defaultValue={cents(zone?.fee ?? null)}
            placeholder={z.toConfirm[lang]}
            inputMode="decimal"
            maxLength={10}
            dir="ltr"
            className={field("fee")}
          />
          {err("fee") && <p className="mt-1 text-[11px] text-red-700">{err("fee")}</p>}
        </div>
        <div>
          <label htmlFor={`${p}-free`} className={label}>{z.freeFrom[lang]}</label>
          <input
            id={`${p}-free`}
            name="free_from"
            defaultValue={cents(zone?.freeFrom ?? null)}
            inputMode="decimal"
            maxLength={10}
            dir="ltr"
            className={field("free_from")}
          />
          {err("free_from") && <p className="mt-1 text-[11px] text-red-700">{err("free_from")}</p>}
        </div>
        <label className="col-span-2 flex items-center gap-2 text-sm font-medium text-bark lg:col-span-1 lg:mt-6">
          <input type="checkbox" name="active" defaultChecked={zone?.active ?? true} className="h-5 w-5 accent-amber" />
          {z.active[lang]}
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        {(errors.form || failed) && (
          <p role="alert" className="me-auto text-xs text-red-700">{z.failed[lang]}</p>
        )}
        {state.saved && zone && !saving && (
          <p role="status" className="me-auto text-xs font-medium text-leaf">✓ {z.saved[lang]}</p>
        )}
        {zone && (
          <button
            type="button"
            disabled={deleting}
            onClick={() => {
              if (!confirm(z.confirmDelete[lang])) return;
              startDelete(async () => {
                const r = await deleteZoneAction(zone.id);
                setFailed(!r.ok);
                router.refresh();
              });
            }}
            className="rounded-xl border border-bark/15 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:border-red-300 disabled:opacity-50"
          >
            {z.delete[lang]}
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-gradient-to-br from-honey to-amber px-4 py-1.5 text-sm font-semibold text-white shadow disabled:opacity-60"
        >
          {zone ? z.save[lang] : `+ ${z.add[lang]}`}
        </button>
      </div>
    </form>
  );
}
