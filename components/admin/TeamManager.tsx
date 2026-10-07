"use client";

import { startTransition, useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/LanguageProvider";
import {
  createStaffAction,
  deleteStaffAction,
  setStaffActiveAction,
  setStaffPasswordAction,
  type StaffState,
} from "@/app/admin/actions";
import { a } from "@/lib/admin-i18n";
import type { StaffAccount } from "@/lib/staff";

export function TeamManager({ staff }: { staff: StaffAccount[] }) {
  const { lang } = useLang();
  const router = useRouter();
  const [state, dispatch, creating] = useActionState<StaffState, FormData>(createStaffAction, {});
  const [busy, startBusy] = useTransition();
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwFor, setPwFor] = useState<string | null>(null);
  const [pw, setPw] = useState("");
  const k = a.team;
  const errors = state.errors ?? {};
  const err = (f: string) => (errors[f] ? (a.errors[errors[f]!] ?? a.errors.invalid)[lang] : null);
  const field = (f: string) =>
    `mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm text-bark outline-none focus:border-honey focus:ring-2 focus:ring-honey/30 ${
      errors[f] ? "border-red-400" : "border-bark/15"
    }`;

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okText?: string) =>
    startBusy(async () => {
      const r = await fn();
      setNotice(
        r.ok
          ? okText ? { ok: true, text: okText } : null
          : { ok: false, text: (r.error && a.errors[r.error]?.[lang]) || k.failed[lang] },
      );
      if (r.ok) {
        setPwFor(null);
        setPw("");
      }
      router.refresh();
    });

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-bark-deep">{k.title[lang]}</h1>
        <p className="mt-2 rounded-xl bg-honey/10 px-4 py-2.5 text-xs text-bark/70">{k.intro[lang]}</p>
      </div>

      <form
        key={state.created ?? "new"}
        // onSubmit (not action=) so React doesn't clear the fields on errors.
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(() => dispatch(fd));
        }}
        noValidate
        aria-label={k.newTitle[lang]}
        className="space-y-3 rounded-2xl border border-bark/10 bg-white p-5"
      >
        <h2 className="text-sm font-semibold text-bark">{k.newTitle[lang]}</h2>
        {state.created && (
          <p role="status" className="rounded-xl bg-leaf/15 px-4 py-2.5 text-sm font-medium text-leaf">
            {k.created[lang]} (<span dir="ltr">{state.created}</span>)
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="staff-name" className="block text-xs font-medium text-bark/80">{k.name[lang]}</label>
            <input id="staff-name" name="name" maxLength={60} autoComplete="off" className={field("name")} />
            {err("name") && <p className="mt-1 text-[11px] text-red-700">{err("name")}</p>}
          </div>
          <div>
            <label htmlFor="staff-username" className="block text-xs font-medium text-bark/80">{k.username[lang]}</label>
            <input id="staff-username" name="username" maxLength={30} autoComplete="off" autoCapitalize="none" dir="ltr" className={`${field("username")} lowercase`} />
            {err("username") ? (
              <p className="mt-1 text-[11px] text-red-700">{err("username")}</p>
            ) : (
              <p className="mt-1 text-[11px] text-bark/50">{k.usernameHint[lang]}</p>
            )}
          </div>
          <div>
            <label htmlFor="staff-password" className="block text-xs font-medium text-bark/80">{k.password[lang]}</label>
            <input id="staff-password" name="password" type="password" maxLength={200} autoComplete="new-password" dir="ltr" className={field("password")} />
            {err("password") && <p className="mt-1 text-[11px] text-red-700">{err("password")}</p>}
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={creating} className="rounded-xl bg-gradient-to-br from-honey to-amber px-5 py-2 text-sm font-semibold text-white shadow disabled:opacity-60">
            + {k.create[lang]}
          </button>
        </div>
      </form>

      <section>
        <h2 className="font-display text-lg font-bold text-bark-deep">{k.list[lang]}</h2>
        {notice && (
          <p role={notice.ok ? "status" : "alert"} className={`mt-2 rounded-xl px-4 py-2.5 text-sm font-medium ${notice.ok ? "bg-leaf/15 text-leaf" : "bg-red-50 text-red-700"}`}>
            {notice.text}
          </p>
        )}
        {staff.length === 0 ? (
          <p className="mt-2 text-sm text-bark/60">{k.empty[lang]}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {staff.map((u) => (
              <li key={u.id} aria-label={u.username} className="rounded-2xl border border-bark/10 bg-white p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-bark-deep">{u.name}</span>
                      <span className="font-mono text-sm text-bark/60" dir="ltr">@{u.username}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${u.active ? "bg-leaf/15 text-leaf" : "bg-bark/10 text-bark/60"}`}>
                        {u.active ? k.active[lang] : k.disabled[lang]}
                      </span>
                    </p>
                    <p className="text-xs text-bark/55">
                      {u.lastLogin ? k.lastLogin[lang].replace("{d}", u.lastLogin.slice(0, 16)) : k.never[lang]}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={busy} onClick={() => setPwFor(pwFor === u.id ? null : u.id)} className="rounded-xl border border-bark/15 bg-white px-3 py-1.5 text-sm font-semibold text-bark hover:border-honey disabled:opacity-50">
                      {k.setPassword[lang]}
                    </button>
                    <button type="button" disabled={busy} onClick={() => run(() => setStaffActiveAction(u.id, !u.active))} className="rounded-xl border border-bark/15 bg-white px-3 py-1.5 text-sm font-semibold text-bark hover:border-honey disabled:opacity-50">
                      {u.active ? k.disable[lang] : k.enable[lang]}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        if (confirm(k.confirmDelete[lang])) run(() => deleteStaffAction(u.id));
                      }}
                      className="rounded-xl border border-bark/15 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:border-red-300 disabled:opacity-50"
                    >
                      {k.delete[lang]}
                    </button>
                  </div>
                </div>
                {pwFor === u.id && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      run(() => setStaffPasswordAction(u.id, pw), k.passwordChanged[lang]);
                    }}
                    className="mt-3 flex flex-wrap items-center gap-2 border-t border-bark/10 pt-3"
                  >
                    <input
                      type="password"
                      value={pw}
                      onChange={(e) => setPw(e.target.value)}
                      maxLength={200}
                      autoComplete="new-password"
                      aria-label={k.newPassword[lang]}
                      placeholder={k.newPassword[lang]}
                      dir="ltr"
                      className="min-w-0 flex-1 rounded-xl border border-bark/15 px-3 py-2 text-sm outline-none focus:border-honey"
                    />
                    <button type="submit" disabled={busy} className="rounded-xl bg-amber px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                      {k.setPassword[lang]}
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
