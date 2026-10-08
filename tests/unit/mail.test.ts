import { afterEach, describe, expect, it } from "vitest";
import { escapeHtml, layout, mailConfigured } from "@/lib/mail";

describe("escapeHtml", () => {
  it("escapes the five HTML special characters", () => {
    expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe(
      "&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;",
    );
  });

  it("escapes & first, so entities are not double-decoded", () => {
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });

  it("leaves Arabic and plain text alone", () => {
    expect(escapeHtml("عسل طبيعي 100%")).toBe("عسل طبيعي 100%");
  });
});

describe("layout", () => {
  it("escapes the body and keeps line breaks", () => {
    const html = layout({ lang: "en", bodyText: "Hi <b>Sam</b>\nThanks" });
    expect(html).toContain("Hi &lt;b&gt;Sam&lt;/b&gt;<br>Thanks");
    expect(html).not.toContain("<b>Sam</b>");
  });

  it("escapes the button label and link", () => {
    const html = layout({
      lang: "en",
      bodyText: "x",
      button: { label: `<img src=x onerror="alert(1)">`, url: `https://nahel.com/?a="b"` },
    });
    expect(html).not.toContain("<img");
    expect(html).toContain(`href="https://nahel.com/?a=&quot;b&quot;"`);
  });

  it("is right-to-left in Arabic and left-to-right in English", () => {
    expect(layout({ lang: "ar", bodyText: "x" })).toContain(`<html lang="ar" dir="rtl">`);
    expect(layout({ lang: "en", bodyText: "x" })).toContain(`<html lang="en" dir="ltr">`);
  });

  it("adds the footer only when given", () => {
    expect(layout({ lang: "en", bodyText: "x", footerHtml: "FOOT" })).toContain("FOOT");
    expect(layout({ lang: "en", bodyText: "x" })).not.toContain("margin-top:18px");
  });
});

describe("mailConfigured", () => {
  afterEach(() => {
    delete process.env.SITE_URL;
    delete process.env.MAIL_DRIVER;
    delete process.env.BREVO_API_KEY;
    delete process.env.MAIL_FROM_EMAIL;
  });

  it("is off by default in tests", () => {
    expect(mailConfigured()).toBe(false);
  });

  it("needs SITE_URL even with Brevo keys (email links never come from the Host header)", () => {
    process.env.BREVO_API_KEY = "test-key";
    process.env.MAIL_FROM_EMAIL = "shop@example.com";
    expect(mailConfigured()).toBe(false);
    process.env.SITE_URL = "https://nahel.example";
    expect(mailConfigured()).toBe(true);
  });

  it("accepts the log driver with SITE_URL", () => {
    process.env.SITE_URL = "https://nahel.example";
    process.env.MAIL_DRIVER = "log";
    expect(mailConfigured()).toBe(true);
  });
});
