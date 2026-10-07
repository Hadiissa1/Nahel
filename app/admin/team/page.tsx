import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { listStaff } from "@/lib/staff";
import { AdminTop } from "@/components/admin/AdminTop";
import { AdminLoading } from "@/components/admin/AdminLoading";
import { TeamManager } from "@/components/admin/TeamManager";

export default function TeamPage() {
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
      <TeamManager staff={listStaff()} />
    </>
  );
}
