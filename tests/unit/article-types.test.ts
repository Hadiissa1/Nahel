import { describe, expect, it } from "vitest";
import { ARTICLE_LIMITS, parseBody, SLUG_RE, slugify } from "@/lib/article-types";

describe("slugify", () => {
  it("turns a title into a URL-friendly slug", () => {
    expect(slugify("How to Store Raw Honey")).toBe("how-to-store-raw-honey");
  });

  it("drops accents and symbols", () => {
    expect(slugify("Crème brûlée & miel!")).toBe("creme-brulee-miel");
  });

  it("trims dashes at both ends", () => {
    expect(slugify("  --Hello, world--  ")).toBe("hello-world");
  });

  it("returns an empty slug for an Arabic-only title", () => {
    expect(slugify("عسل السدر")).toBe("");
  });

  it(`is at most ${ARTICLE_LIMITS.slug} characters and never ends with a dash`, () => {
    const slug = slugify("word ".repeat(40));
    expect(slug.length).toBeLessThanOrEqual(ARTICLE_LIMITS.slug);
    expect(slug.endsWith("-")).toBe(false);
    expect(SLUG_RE.test(slug)).toBe(true);
  });
});

describe("SLUG_RE", () => {
  it("accepts lower-case words separated by single dashes", () => {
    expect(SLUG_RE.test("raw-honey-101")).toBe(true);
  });

  it.each(["Raw-Honey", "raw--honey", "-raw", "raw-", "raw honey", ""])("rejects %j", (s) => {
    expect(SLUG_RE.test(s)).toBe(false);
  });
});

describe("parseBody", () => {
  it("splits paragraphs on blank lines and joins wrapped lines", () => {
    expect(parseBody("First line\nsame paragraph\n\nSecond")).toEqual([
      { type: "p", text: "First line same paragraph" },
      { type: "p", text: "Second" },
    ]);
  });

  it("reads ## headings and - / • / * list items", () => {
    expect(parseBody("## Storage\n- dry\n• dark\n* cool")).toEqual([
      { type: "h2", text: "Storage" },
      { type: "ul", items: ["dry", "dark", "cool"] },
    ]);
  });

  it("closes a list when a paragraph follows, and a paragraph when a list follows", () => {
    expect(parseBody("Intro\n- a\n- b\nOutro")).toEqual([
      { type: "p", text: "Intro" },
      { type: "ul", items: ["a", "b"] },
      { type: "p", text: "Outro" },
    ]);
  });

  it("handles Windows line endings", () => {
    expect(parseBody("A\r\n\r\nB")).toEqual([
      { type: "p", text: "A" },
      { type: "p", text: "B" },
    ]);
  });

  it("keeps HTML as plain text (rendering escapes it)", () => {
    expect(parseBody("<script>alert(1)</script>")).toEqual([{ type: "p", text: "<script>alert(1)</script>" }]);
  });

  it("returns no blocks for empty text", () => {
    expect(parseBody("")).toEqual([]);
    expect(parseBody("\n\n  \n")).toEqual([]);
  });
});
