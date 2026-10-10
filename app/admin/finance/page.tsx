import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { PERIODS, buildReport, periodDays, type PeriodKey } from "@/lib/finance";
import { shopDay } from "@/lib/shop-time";
import { AdminTop } from "@/components/admin/AdminTop";
import { AdminLoading } from "@/components/admin/AdminLoading";
import { FinanceDashboard } from "@/components/admin/FinanceDashboard";

export default function FinancePage({ searchParams }: PageProps<"/admin/finance">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/admin/finance">["searchParams"] }) {
  await requireAdmin(); // finance is for the owner only
  const sp = await searchParams;
  const str = (v: unknown) => (typeof v === "string" ? v : undefined);
  const period = (PERIODS.includes(str(sp.period) as PeriodKey) ? str(sp.period) : "today") as PeriodKey;
  const { from, to } = periodDays(period, str(sp.from), str(sp.to));
  return (
    <>
      <AdminTop />
      <FinanceDashboard key={`${period}-${from}-${to}`} period={period} report={await buildReport(from, to)} today={shopDay()} />
    </>
  );
}
