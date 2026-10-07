import type { LocalizedText } from "@/lib/data";

export interface Article {
  id: string;
  slug: string;
  title: LocalizedText;
  summary: LocalizedText;
  body: LocalizedText;
  /** Photo id (see photoUrl), or null. */
  photo: string | null;
  /** Related product ids. */
  products: string[];
  /** YYYY-MM-DD */
  publishedOn: string | null;
}

export interface AdminArticle extends Article {
  published: boolean;
  updatedAt: string;
}

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const ARTICLE_LIMITS = { title: 150, summary: 300, body: 20000, slug: 80, products: 6 };

/** URL-friendly slug from a (usually English) title. */
export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, ARTICLE_LIMITS.slug)
    .replace(/-+$/, "");
}

export type Block = { type: "h2"; text: string } | { type: "p"; text: string } | { type: "ul"; items: string[] };

/**
 * The simple article format: blank line = new paragraph, "## " = heading,
 * "- " = list item. Plain text only, so nothing can be injected.
 */
export function parseBody(text: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ type: "p", text: para.join(" ") });
    if (list.length) blocks.push({ type: "ul", items: list });
    para = [];
    list = [];
  };
  for (const raw of text.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) flush();
    else if (line.startsWith("## ")) {
      flush();
      blocks.push({ type: "h2", text: line.slice(3).trim() });
    } else if (/^[-•*] /.test(line)) {
      if (para.length) {
        blocks.push({ type: "p", text: para.join(" ") });
        para = [];
      }
      list.push(line.slice(2).trim());
    } else {
      if (list.length) {
        blocks.push({ type: "ul", items: list });
        list = [];
      }
      para.push(line);
    }
  }
  flush();
  return blocks;
}
