import { afterEach, vi } from "vitest";

export interface SentMail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Turns on the Brevo email driver with a fake key and catches the API calls,
 * so nothing leaves the machine. `ok: false` makes Brevo refuse every email.
 * Call it inside a test; everything is undone after the test.
 */
export function fakeBrevo(opts: { ok?: boolean } = {}) {
  process.env.SITE_URL = "https://nahel.test";
  process.env.BREVO_API_KEY = "test-key";
  process.env.MAIL_FROM_EMAIL = "shop@nahel.test";
  const sent: SentMail[] = [];
  const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
    if (String(url) !== "https://api.brevo.com/v3/smtp/email") throw new Error(`unexpected fetch: ${url}`);
    const body = JSON.parse(String(init?.body));
    sent.push({ to: body.to[0].email, subject: body.subject, html: body.htmlContent, text: body.textContent });
    return new Response("{}", { status: opts.ok === false ? 500 : 201 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return { sent, fetchMock };
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.SITE_URL;
  delete process.env.BREVO_API_KEY;
  delete process.env.MAIL_FROM_EMAIL;
});
