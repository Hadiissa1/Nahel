import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/products";
import { getPublishedArticles } from "@/lib/articles";
import { siteUrl } from "@/lib/site";

/** /sitemap.xml: home page, products, tips (needs SITE_URL). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  if (!base) return [];
  const [products, articles] = await Promise.all([getCatalog(), getPublishedArticles()]);
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/lot`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.6 },
    ...articles.map((a) => ({
      url: `${base}/blog/${a.slug}`,
      ...(a.publishedOn && { lastModified: a.publishedOn }),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...products.map((p) => ({
      url: `${base}/product/${encodeURIComponent(p.id)}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
