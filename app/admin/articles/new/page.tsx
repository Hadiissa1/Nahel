import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { listAdminProducts } from "@/lib/products";
import { AdminTop } from "@/components/admin/AdminTop";
import { AdminLoading } from "@/components/admin/AdminLoading";
import { ArticleForm } from "@/components/admin/ArticleForm";

export default function NewArticlePage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  await requireAdmin();
  return (
    <>
      <AdminTop />
      <ArticleForm products={listAdminProducts().map((p) => ({ id: p.id, name: p.name }))} />
    </>
  );
}
