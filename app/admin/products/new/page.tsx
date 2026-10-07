import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ProductForm } from "@/components/admin/ProductForm";
import { AdminLoading } from "@/components/admin/AdminLoading";

export default function NewProductPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <NewProduct />
    </Suspense>
  );
}

async function NewProduct() {
  await requireAdmin();
  return (
    <>
      <AdminHeader />
      <ProductForm />
    </>
  );
}
