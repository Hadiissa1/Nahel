import "server-only";
import { appendFile } from "node:fs/promises";
import path from "node:path";
import { DATA_DIR, db } from "@/lib/db";

/**
 * Outgoing email.
 *
 * - MAIL_DRIVER=log      → emails are appended to DATA_DIR/outbox.log (testing).
 * - BREVO_API_KEY + MAIL_FROM_EMAIL → sent through Brevo's transactional API.
 *
 * SITE_URL (e.g. https://nahel.com) is required: links in emails must never be
 * built from the request's Host header, which a client can forge.
 */

export function siteUrl(): string | null {
  const url = process.env.SITE_URL?.trim().replace(/\/+$/, "");
  return url && /^https?:\/\/[^\s/]+$/.test(url) ? url : null;
}

type Driver = "log" | "brevo" | null;
function driver(): Driver {
  if (!siteUrl()) return null;
  if (process.env.MAIL_DRIVER === "log") return "log";
  if (process.env.BREVO_API_KEY && process.env.MAIL_FROM_EMAIL) return "brevo";
  return null;
}

export function mailConfigured() {
  return driver() !== null;
}

export interface Mail {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** One-click unsubscribe URL (RFC 8058), added as List-Unsubscribe headers. */
  unsubscribeUrl?: string;
}

export async function sendMail(mail: Mail): Promise<boolean> {
  const d = driver();
  if (d === "log") {
    db(); // make sure DATA_DIR exists
    await appendFile(
      path.join(DATA_DIR, "outbox.log"),
      JSON.stringify({ at: new Date().toISOString(), ...mail }) + "\n",
    );
    return true;
  }
  if (d === "brevo") {
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": process.env.BREVO_API_KEY!,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          sender: {
            email: process.env.MAIL_FROM_EMAIL,
            name: process.env.MAIL_FROM_NAME || "Nahel",
          },
          to: [{ email: mail.to }],
          subject: mail.subject,
          htmlContent: mail.html,
          textContent: mail.text,
          ...(mail.unsubscribeUrl && {
            headers: {
              "List-Unsubscribe": `<${mail.unsubscribeUrl}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          }),
        }),
        signal: AbortSignal.timeout(15_000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
  return false;
}

// ---------- Templates ----------

export function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Wrap plain text (escaped, newlines kept) in a simple branded email. */
export function layout(opts: {
  lang: "ar" | "en";
  bodyText: string;
  button?: { label: string; url: string };
  footerHtml?: string;
}) {
  const rtl = opts.lang === "ar";
  const body = escapeHtml(opts.bodyText).replace(/\n/g, "<br>");
  const button = opts.button
    ? `<p style="margin:28px 0"><a href="${escapeHtml(opts.button.url)}" style="background:#b9740f;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:bold;display:inline-block">${escapeHtml(opts.button.label)}</a></p>`
    : "";
  return `<!doctype html><html lang="${opts.lang}" dir="${rtl ? "rtl" : "ltr"}"><body style="margin:0;background:#fbf6ec;font-family:Tahoma,Arial,sans-serif;color:#2b1d0e">
<div style="max-width:560px;margin:0 auto;padding:28px 20px;text-align:${rtl ? "right" : "left"}">
<p style="font-size:22px;font-weight:bold;color:#3f2611;margin:0 0 20px">${rtl ? "نحّال" : "Nahel"} 🍯</p>
<div style="background:#fff;border-radius:16px;padding:24px;line-height:1.7;font-size:15px">${body}${button}</div>
${opts.footerHtml ? `<p style="font-size:12px;color:#8a7560;margin-top:18px;line-height:1.6">${opts.footerHtml}</p>` : ""}
</div></body></html>`;
}
