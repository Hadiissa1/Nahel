import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { listAdminArticles } from "@/lib/articles";
import { AdminTop } from "@/components/admin/AdminTop";
import { AdminLoading } from "@/components/admin/AdminLoading";
import { ArticleList } from "@/components/admin/ArticleList";

export default function ArticlesPage({ searchParams }: PageProps<"/admin/articles">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/admin/articles">["searchParams"] }) {
  await requireAdmin();
  const { saved } = await searchParams;
  const s = typeof saved === "string" ? saved : undefined;
  return (
    <>
      <AdminTop />
      <ArticleList key={s ?? "list"} articles={listAdminArticles()} saved={s} />
    </>
  );
}
