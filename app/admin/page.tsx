import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { listAdminProducts } from "@/lib/products";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ProductList } from "@/components/admin/ProductList";
import { AdminLoading } from "@/components/admin/AdminLoading";

export default function AdminPage({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Products searchParams={searchParams} />
    </Suspense>
  );
}

async function Products({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  await requireAdmin();
  const { saved } = await searchParams;
  return (
    <>
      <AdminHeader />
      {/* Keyed by the save result so the confirmation shows even when the
          router reuses this page after an in-app navigation. */}
      <ProductList
        key={typeof saved === "string" ? saved : "list"}
        products={listAdminProducts()}
        saved={typeof saved === "string" ? saved : undefined}
      />
    </>
  );
}
