import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { listAdminZones } from "@/lib/delivery";
import { AdminTop } from "@/components/admin/AdminTop";
import { AdminLoading } from "@/components/admin/AdminLoading";
import { ZoneManager } from "@/components/admin/ZoneManager";

export default function DeliveryPage() {
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
      <ZoneManager zones={await listAdminZones()} />
    </>
  );
}
