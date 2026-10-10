import { Suspense } from "react";
import { requireStaff } from "@/lib/auth";
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
  const me = await requireStaff(); // open to staff
  return (
    <>
      <AdminTop />
      <OrderList orders={await listOrders()} isOwner={me.role === "owner"} />
    </>
  );
}
