import "server-only";
import { countNewOrders } from "@/lib/orders";
import { countReadyAlerts } from "@/lib/stock-alerts";
import { countPendingReviews } from "@/lib/reviews";
import { countLowStock } from "@/lib/low-stock";
import { AdminHeader } from "@/components/admin/AdminHeader";

/** Admin header with live counts (badges). Render after requireAdmin(). */
export function AdminTop() {
  return (
    <AdminHeader
      newOrders={countNewOrders()}
      readyAlerts={countReadyAlerts()}
      pendingReviews={countPendingReviews()}
      lowStock={countLowStock()}
    />
  );
}
