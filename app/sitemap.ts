import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/products";
import { siteUrl } from "@/lib/site";

/** /sitemap.xml: home page + every visible product (needs SITE_URL). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  if (!base) return [];
  const products = await getCatalog();
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    ...products.map((p) => ({
      url: `${base}/product/${encodeURIComponent(p.id)}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
