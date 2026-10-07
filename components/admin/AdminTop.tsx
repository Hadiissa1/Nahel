import "server-only";
import { countNewOrders } from "@/lib/orders";
import { countReadyAlerts } from "@/lib/stock-alerts";
import { AdminHeader } from "@/components/admin/AdminHeader";

/** Admin header with the live count of new orders. Render after requireAdmin(). */
export function AdminTop() {
  return <AdminHeader newOrders={countNewOrders()} readyAlerts={countReadyAlerts()} />;
}
