import { Suspense } from "react";
import { after } from "next/server";
import { requireStaff } from "@/lib/auth";
import { listReadyAlerts, listWaiting, sendRestockEmails } from "@/lib/stock-alerts";
import { AdminTop } from "@/components/admin/AdminTop";
import { AdminLoading } from "@/components/admin/AdminLoading";
import { AlertList } from "@/components/admin/AlertList";

export default function AlertsPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  await requireStaff(); // open to staff
  // Catch-up: emails that couldn't go out before (e.g. email set up later).
  after(() => sendRestockEmails().catch(() => 0));
  return (
    <>
      <AdminTop />
      <AlertList ready={listReadyAlerts()} waiting={listWaiting()} />
    </>
  );
}
