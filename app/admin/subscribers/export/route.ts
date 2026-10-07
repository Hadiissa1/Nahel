import { isAdmin } from "@/lib/auth";
import { listSubscribers } from "@/lib/subscribers";

const quote = (s: string) => `"${s.replace(/"/g, '""')}"`;

/** Text typed by visitors: neutralise spreadsheet formulas (=, +, -, @). */
function cell(v: string | null) {
  const s = v ?? "";
  return quote(/^[=+\-@\t\r]/.test(s) ? `'${s}` : s);
}

export async function GET() {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const rows = listSubscribers().map((s) =>
    [
      cell(s.email),
      // Numbers are stored as verified digits only, so "+…" is safe as-is.
      quote(s.whatsapp ? `+${s.whatsapp}` : ""),
      cell(s.lang),
      cell(s.emailConfirmed ? "yes" : "no"),
      cell(s.createdAt),
    ].join(","),
  );
  const csv = ["email,whatsapp,language,email_confirmed,since", ...rows].join("\r\n");
  // BOM so Excel opens Arabic text correctly.
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="nahel-subscribers.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
