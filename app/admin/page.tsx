import { Suspense } from "react";
import { requireStaff } from "@/lib/auth";
import { listAdminProducts } from "@/lib/products";
import { getStockSettings, listLowStock } from "@/lib/low-stock";
import { mailConfigured } from "@/lib/mail";
import { AdminTop } from "@/components/admin/AdminTop";
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
  const me = await requireStaff(); // open to staff
  const { saved } = await searchParams;
  const settings = getStockSettings();
  return (
    <>
      <AdminTop />
      {/* Keyed by the save result so the confirmation shows even when the
          router reuses this page after an in-app navigation. */}
      <ProductList
        key={typeof saved === "string" ? saved : "list"}
        products={listAdminProducts()}
        saved={typeof saved === "string" ? saved : undefined}
        settings={settings}
        low={listLowStock(settings.threshold)}
        canEmail={mailConfigured()}
        isOwner={me.role === "owner"}
      />
    </>
  );
}
