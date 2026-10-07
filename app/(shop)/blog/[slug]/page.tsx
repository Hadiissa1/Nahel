import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArticleView } from "@/components/BlogViews";
import { getArticle, getPublishedArticles } from "@/lib/articles";
import { siteUrl } from "@/lib/site";
import { photoUrl } from "@/lib/catalog-types";
import type { Article } from "@/lib/article-types";

export async function generateStaticParams() {
  const articles = await getPublishedArticles();
  return articles.length ? articles.map((a) => ({ slug: a.slug })) : [{ slug: "__none__" }];
}

const titleOf = (a: Article) => `${[a.title.ar, a.title.en].filter(Boolean).join(" | ")} — نحّال Nahel`;

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const a = await getArticle(slug);
  if (!a) return { title: "نحّال Nahel", robots: { index: false } };
  const title = titleOf(a);
  const description = [a.summary.ar, a.summary.en].filter(Boolean).join(" — ").slice(0, 200);
  const url = `/blog/${a.slug}`;
  const images = a.photo ? [{ url: photoUrl(a.photo, "lg"), alt: title }] : undefined;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "article", siteName: "نحّال Nahel", title, description, url, images, publishedTime: a.publishedOn ?? undefined },
    twitter: { card: images ? "summary_large_image" : "summary", title, description },
  };
}

/** schema.org Article data for Google. */
function jsonLd(a: Article) {
  const base = siteUrl() ?? "";
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: (a.title.ar || a.title.en).slice(0, 110),
    ...(a.title.ar && a.title.en && { alternativeHeadline: a.title.en.slice(0, 110) }),
    description: a.summary.ar || a.summary.en,
    ...(a.photo && { image: `${base}${photoUrl(a.photo, "lg")}` }),
    ...(a.publishedOn && { datePublished: a.publishedOn }),
    author: { "@type": "Organization", name: "Nahel" },
    publisher: { "@type": "Organization", name: "Nahel" },
    mainEntityOfPage: `${base}/blog/${a.slug}`,
  };
  // "<" escaped so text can never close the script tag.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default function ArticlePage({ params }: PageProps<"/blog/[slug]">) {
  return (
    <>
      <Header />
      {/* params are read inside <Suspense> (see the product page). */}
      <Suspense fallback={<main className="min-h-[70vh] flex-1 bg-cream" />}>
        <Content params={params} />
      </Suspense>
      <Footer />
    </>
  );
}

async function Content({ params }: { params: PageProps<"/blog/[slug]">["params"] }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();
  return (
    <>
      <ArticleView article={article} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(article) }} />
    </>
  );
}
