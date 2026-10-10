import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { layout, mailConfigured, sendMail, siteUrl } from "@/lib/mail";

export type SubLang = "ar" | "en";

export interface Subscriber {
  id: string;
  email: string | null;
  whatsapp: string | null;
  lang: SubLang;
  token: string;
  emailConfirmed: boolean;
  createdAt: string;
}

interface Row {
  id: string;
  email: string | null;
  whatsapp: string | null;
  lang: SubLang;
  token: string;
  email_confirmed_at: string | null;
  confirm_sent_at: string | null;
  created_at: string;
}

const toSub = (r: Row): Subscriber => ({
  id: r.id,
  email: r.email,
  whatsapp: r.whatsapp,
  lang: r.lang,
  token: r.token,
  emailConfirmed: !!r.email_confirmed_at,
  createdAt: r.created_at,
});

// ---------- Input normalization ----------

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]{1,64}@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/;

export function normalizeEmail(raw: string): string | null | "invalid" {
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  return v.length <= 254 && EMAIL_RE.test(v) ? v : "invalid";
}

/** International number, digits only (e.g. "96170123456"). */
export function normalizeWhatsapp(raw: string): string | null | "invalid" {
  const v = raw.trim();
  if (!v) return null;
  if (!/^\+?[0-9\s().-]{6,25}$/.test(v)) return "invalid";
  let digits = v.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  return digits.length >= 8 && digits.length <= 15 ? digits : "invalid";
}

// ---------- Emails ----------

const T = {
  confirmSubject: { ar: "أكّد اشتراكك في عروض نحّال", en: "Confirm your Nahel offers subscription" },
  confirmBody: {
    ar: "مرحباً!\n\nطلبت تلقي عروض وتخفيضات نحّال على هذا البريد. اضغط على الزر لتأكيد اشتراكك.\n\nإذا لم تطلب ذلك، تجاهل هذه الرسالة ولن تصلك أي رسائل.",
    en: "Hello!\n\nYou asked to receive Nahel offers and sales at this address. Tap the button to confirm your subscription.\n\nIf this wasn't you, just ignore this email and you won't hear from us.",
  },
  confirmButton: { ar: "تأكيد الاشتراك", en: "Confirm subscription" },
  footer: {
    ar: "تصلك هذه الرسالة لأنك اشتركت في عروض نحّال.",
    en: "You receive this email because you subscribed to Nahel offers.",
  },
  unsubscribe: { ar: "إلغاء الاشتراك", en: "Unsubscribe" },
};

function links(token: string) {
  const base = siteUrl()!;
  const t = encodeURIComponent(token);
  return {
    confirm: `${base}/offers/confirm?token=${t}`,
    unsubscribe: `${base}/offers/unsubscribe?token=${t}`,
    oneClick: `${base}/offers/unsubscribe/one-click?token=${t}`,
  };
}

async function sendConfirmation(sub: Row): Promise<boolean> {
  if (!sub.email || !mailConfigured()) return false;
  const l = links(sub.token);
  const lang = sub.lang;
  const ok = await sendMail({
    to: sub.email,
    subject: T.confirmSubject[lang],
    html: layout({
      lang,
      bodyText: T.confirmBody[lang],
      button: { label: T.confirmButton[lang], url: l.confirm },
    }),
    text: `${T.confirmBody[lang]}\n\n${l.confirm}`,
  });
  if (ok) {
    await db().prepare("UPDATE subscribers SET confirm_sent_at = datetime('now') WHERE id = ?").run(sub.id);
  }
  return ok;
}

// ---------- Public operations ----------

/**
 * Add or update a subscription. Always behaves the same whether or not the
 * address already exists (no way to probe who is subscribed). A confirmation
 * email is sent at most once every 10 minutes per subscriber.
 */
export async function subscribe(input: {
  email: string | null;
  whatsapp: string | null;
  lang: SubLang;
}): Promise<void> {
  const d = db();
  const existing = (await d
    .prepare("SELECT * FROM subscribers WHERE email = ? OR whatsapp = ? LIMIT 1")
    .get(input.email ?? "\u0000", input.whatsapp ?? "\u0000")) as Row | undefined;

  let row: Row;
  if (existing) {
    // Fill in what's missing; never move an address that belongs to someone else.
    const emailFree =
      input.email &&
      !existing.email &&
      !(await d.prepare("SELECT 1 FROM subscribers WHERE email = ?").get(input.email));
    const waFree =
      input.whatsapp &&
      !existing.whatsapp &&
      !(await d.prepare("SELECT 1 FROM subscribers WHERE whatsapp = ?").get(input.whatsapp));
    await d.prepare(
      "UPDATE subscribers SET email = COALESCE(email, ?), whatsapp = COALESCE(whatsapp, ?), lang = ? WHERE id = ?",
    ).run(emailFree ? input.email : null, waFree ? input.whatsapp : null, input.lang, existing.id);
    row = (await d.prepare("SELECT * FROM subscribers WHERE id = ?").get(existing.id)) as Row;
  } else {
    const id = randomUUID();
    await d.prepare(
      "INSERT INTO subscribers (id, email, whatsapp, lang, token) VALUES (?, ?, ?, ?, ?)",
    ).run(id, input.email, input.whatsapp, input.lang, randomBytes(24).toString("base64url"));
    row = (await d.prepare("SELECT * FROM subscribers WHERE id = ?").get(id)) as Row;
  }

  const recentlySent =
    row.confirm_sent_at &&
    Date.now() - Date.parse(row.confirm_sent_at + "Z") < 10 * 60 * 1000;
  if (row.email && !row.email_confirmed_at && !recentlySent) {
    await sendConfirmation(row);
  }
}

const TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/;

export async function findByToken(token: string): Promise<Subscriber | null> {
  if (!TOKEN_RE.test(token)) return null;
  const r = (await db().prepare("SELECT * FROM subscribers WHERE token = ?").get(token)) as Row | undefined;
  return r ? toSub(r) : null;
}

export async function confirmEmail(token: string): Promise<boolean> {
  if (!TOKEN_RE.test(token)) return false;
  const r = await db()
    .prepare(
      "UPDATE subscribers SET email_confirmed_at = COALESCE(email_confirmed_at, datetime('now')) WHERE token = ? AND email IS NOT NULL",
    )
    .run(token);
  return r.changes > 0;
}

/** Unsubscribing deletes the subscriber entirely (we keep no data). */
export async function unsubscribe(token: string): Promise<boolean> {
  if (!TOKEN_RE.test(token)) return false;
  return (await db().prepare("DELETE FROM subscribers WHERE token = ?").run(token)).changes > 0;
}

// ---------- Admin operations ----------

export async function listSubscribers(): Promise<Subscriber[]> {
  return ((await db().prepare("SELECT * FROM subscribers ORDER BY created_at DESC").all()) as unknown as Row[]).map(toSub);
}

export async function deleteSubscriber(id: string): Promise<boolean> {
  return (await db().prepare("DELETE FROM subscribers WHERE id = ?").run(id)).changes > 0;
}

/** Re-send confirmation emails to subscribers who haven't confirmed yet. */
export async function resendConfirmations(): Promise<{ sent: number; failed: number }> {
  const rows = (await db()
    .prepare("SELECT * FROM subscribers WHERE email IS NOT NULL AND email_confirmed_at IS NULL")
    .all()) as unknown as Row[];
  let sent = 0;
  let failed = 0;
  for (const r of rows) {
    if (await sendConfirmation(r)) sent++;
    else failed++;
  }
  return { sent, failed };
}

export interface CampaignInput {
  subject: { ar: string; en: string };
  body: { ar: string; en: string };
}

const pick = (t: { ar: string; en: string }, lang: SubLang) =>
  t[lang] || t[lang === "ar" ? "en" : "ar"];

function campaignMail(c: CampaignInput, to: string, lang: SubLang, token: string) {
  const l = links(token);
  const footer = `${T.footer[lang]} <a href="${l.unsubscribe}" style="color:#8a7560">${T.unsubscribe[lang]}</a>`;
  return {
    to,
    subject: pick(c.subject, lang),
    html: layout({ lang, bodyText: pick(c.body, lang), footerHtml: footer }),
    text: `${pick(c.body, lang)}\n\n${T.footer[lang]} ${T.unsubscribe[lang]}: ${l.unsubscribe}`,
    unsubscribeUrl: l.oneClick,
  };
}

/** Email a promotion to every confirmed subscriber (5 at a time). */
export async function sendCampaign(c: CampaignInput): Promise<{ sent: number; failed: number }> {
  const rows = (await db()
    .prepare("SELECT * FROM subscribers WHERE email IS NOT NULL AND email_confirmed_at IS NOT NULL")
    .all()) as unknown as Row[];
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < rows.length; i += 5) {
    const results = await Promise.all(
      rows.slice(i, i + 5).map((r) => sendMail(campaignMail(c, r.email!, r.lang, r.token))),
    );
    sent += results.filter(Boolean).length;
    failed += results.filter((ok) => !ok).length;
  }
  await db()
    .prepare(
      "INSERT INTO campaigns (id, subject_ar, subject_en, body_ar, body_en, sent, failed) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .run(randomUUID(), c.subject.ar, c.subject.en, c.body.ar, c.body.en, sent, failed);
  return { sent, failed };
}

export async function sendTestCampaign(c: CampaignInput, to: string, lang: SubLang) {
  return sendMail(campaignMail(c, to, lang, "test-preview-token-not-valid-000"));
}

export interface CampaignRecord {
  id: string;
  subject: string;
  sent: number;
  failed: number;
  createdAt: string;
}

export async function listCampaigns(): Promise<CampaignRecord[]> {
  return (
    (await db()
      .prepare("SELECT * FROM campaigns ORDER BY created_at DESC LIMIT 20")
      .all()) as unknown as {
      id: string;
      subject_ar: string;
      subject_en: string;
      sent: number;
      failed: number;
      created_at: string;
    }[]
  ).map((r) => ({
    id: r.id,
    subject: r.subject_ar || r.subject_en,
    sent: r.sent,
    failed: r.failed,
    createdAt: r.created_at,
  }));
}
