import "server-only";
import { getSession } from "@/lib/auth";
import { countNewOrders } from "@/lib/orders";
import { countReadyAlerts } from "@/lib/stock-alerts";
import { countPendingReviews } from "@/lib/reviews";
import { countLowStock } from "@/lib/low-stock";
import { AdminHeader } from "@/components/admin/AdminHeader";

/** Admin header with live counts (badges) and the tabs this user may open. Render after requireAdmin()/requireStaff(). */
export async function AdminTop() {
  const me = await getSession();
  const owner = me?.role === "owner";
  return (
    <AdminHeader
      isOwner={owner}
      userName={owner ? null : (me?.name ?? null)}
      newOrders={countNewOrders()}
      readyAlerts={countReadyAlerts()}
      pendingReviews={owner ? countPendingReviews() : 0}
      lowStock={countLowStock()}
    />
  );
}
