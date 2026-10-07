import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { mailConfigured } from "@/lib/mail";
import { listSubscribers } from "@/lib/subscribers";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminLoading } from "@/components/admin/AdminLoading";
import { SubscriberList } from "@/components/admin/SubscriberList";

export default function SubscribersPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  await requireAdmin();
  // Never send subscribers' private link tokens to the browser.
  const subs = listSubscribers().map((s) => ({
    id: s.id,
    email: s.email,
    whatsapp: s.whatsapp,
    lang: s.lang,
    emailConfirmed: s.emailConfirmed,
    createdAt: s.createdAt,
  }));
  return (
    <>
      <AdminHeader />
      <SubscriberList subscribers={subs} canEmail={mailConfigured()} />
    </>
  );
}
