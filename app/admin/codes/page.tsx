import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { listPromoCodes } from "@/lib/promo";
import { AdminTop } from "@/components/admin/AdminTop";
import { AdminLoading } from "@/components/admin/AdminLoading";
import { CodeManager } from "@/components/admin/CodeManager";

export default function CodesPage() {
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
      <CodeManager codes={listPromoCodes()} />
    </>
  );
}
