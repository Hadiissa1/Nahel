import { isAdmin } from "@/lib/auth";
import { periodDays, salesRows } from "@/lib/finance";

/** Delivered sales of a period as CSV (opens in Excel), for the accountant. Owner only. */
export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const url = new URL(req.url);
  const { from, to } = periodDays("custom", url.searchParams.get("from") ?? undefined, url.searchParams.get("to") ?? undefined);
  const money = (c: number | null) => (c === null ? "" : (c / 100).toFixed(2));
  // Neutralize spreadsheet formulas in text cells (=, +, -, @).
  const text = (s: string | null) => {
    const v = (s ?? "").replace(/"/g, '""');
    return `"${/^[=+\-@]/.test(v) ? `'${v}` : v}"`;
  };
  const lines = [
    "order,date_utc,channel,payment,customer,subtotal,discount,delivery,total,handled_by",
    ...salesRows(from, to).map((r) =>
      [r.id, r.delivered_at, r.source, r.payment ?? "on_delivery", text(r.name), money(r.subtotal), money(r.discount), money(r.delivery_fee), money(r.total), text(r.handled_by)].join(","),
    ),
  ];
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="nahel-sales-${from}-to-${to}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
