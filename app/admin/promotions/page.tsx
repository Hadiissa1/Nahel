import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { mailConfigured } from "@/lib/mail";
import { listCampaigns, listSubscribers } from "@/lib/subscribers";
import { AdminTop } from "@/components/admin/AdminTop";
import { AdminLoading } from "@/components/admin/AdminLoading";
import { PromotionComposer } from "@/components/admin/PromotionComposer";

export default function PromotionsPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  await requireAdmin();
  const subs = listSubscribers();
  return (
    <>
      <AdminTop />
      <PromotionComposer
        canEmail={mailConfigured()}
        emailCount={subs.filter((s) => s.email && s.emailConfirmed).length}
        whatsapp={subs.filter((s) => s.whatsapp).map((s) => ({ id: s.id, number: s.whatsapp!, lang: s.lang }))}
        history={listCampaigns()}
      />
    </>
  );
}
