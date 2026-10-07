import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getAdminProduct } from "@/lib/products";
import { AdminTop } from "@/components/admin/AdminTop";
import { ProductForm } from "@/components/admin/ProductForm";
import { AdminLoading } from "@/components/admin/AdminLoading";

export default function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <EditProduct params={params} />
    </Suspense>
  );
}

async function EditProduct({ params }: { params: PageProps<"/admin/products/[id]">["params"] }) {
  await requireAdmin();
  const { id } = await params;
  const product = getAdminProduct(decodeURIComponent(id));
  if (!product) notFound();
  return (
    <>
      <AdminTop />
      <ProductForm product={product} />
    </>
  );
}
