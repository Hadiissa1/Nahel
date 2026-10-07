import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { listOrders } from "@/lib/orders";
import { AdminTop } from "@/components/admin/AdminTop";
import { AdminLoading } from "@/components/admin/AdminLoading";
import { OrderList } from "@/components/admin/OrderList";

export default function OrdersPage() {
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
      <OrderList orders={listOrders()} />
    </>
  );
}
