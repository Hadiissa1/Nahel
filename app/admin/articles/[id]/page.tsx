import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getAdminArticle } from "@/lib/articles";
import { listAdminProducts } from "@/lib/products";
import { AdminTop } from "@/components/admin/AdminTop";
import { AdminLoading } from "@/components/admin/AdminLoading";
import { ArticleForm } from "@/components/admin/ArticleForm";

export default function EditArticlePage({ params }: PageProps<"/admin/articles/[id]">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/admin/articles/[id]">["params"] }) {
  await requireAdmin();
  const { id } = await params;
  const article = getAdminArticle(decodeURIComponent(id));
  if (!article) notFound();
  return (
    <>
      <AdminTop />
      <ArticleForm article={article} products={listAdminProducts().map((p) => ({ id: p.id, name: p.name }))} />
    </>
  );
}
