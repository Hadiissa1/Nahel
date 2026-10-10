import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { listAdminReviews } from "@/lib/reviews";
import { AdminTop } from "@/components/admin/AdminTop";
import { AdminLoading } from "@/components/admin/AdminLoading";
import { ReviewList } from "@/components/admin/ReviewList";

export default function ReviewsPage() {
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
      <ReviewList reviews={await listAdminReviews()} />
    </>
  );
}
