import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BlogIndex } from "@/components/BlogViews";
import { getPublishedArticles } from "@/lib/articles";

export const metadata: Metadata = {
  title: "نصائح حول العسل · Honey tips — نحّال Nahel",
  description:
    "نصائح عملية من المنحل: حفظ العسل واختياره. Practical advice from the apiary: storing, choosing and enjoying honey.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const articles = await getPublishedArticles();
  return (
    <>
      <Header />
      <BlogIndex articles={articles} />
      <Footer />
    </>
  );
}
