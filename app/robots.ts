import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/** /robots.txt: index the shop, keep private pages out of search engines. */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/offers/", "/og/"] },
    ...(base && { sitemap: `${base}/sitemap.xml` }),
  };
}
