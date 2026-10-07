import { Suspense } from "react";
import { requireStaff } from "@/lib/auth";
import { listAdminProducts } from "@/lib/products";
import { AdminTop } from "@/components/admin/AdminTop";
import { AdminLoading } from "@/components/admin/AdminLoading";
import { PosTerminal } from "@/components/admin/PosTerminal";

export default function PosPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  await requireStaff(); // staff run the till
  return (
    <>
      <AdminTop />
      <PosTerminal products={listAdminProducts()} />
    </>
  );
}
