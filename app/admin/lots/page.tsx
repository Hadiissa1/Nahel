import { Suspense } from "react";
import QRCode from "qrcode";
import { requireAdmin } from "@/lib/auth";
import { listAdminLots } from "@/lib/lots";
import { listAdminProducts } from "@/lib/products";
import { siteUrl } from "@/lib/site";
import { AdminTop } from "@/components/admin/AdminTop";
import { AdminLoading } from "@/components/admin/AdminLoading";
import { LotManager } from "@/components/admin/LotManager";

export default function LotsPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  await requireAdmin();
  const site = siteUrl();
  const lots = listAdminLots();
  // QR codes point to the public lot page; they need the site's real address.
  const qr: Record<string, string> = {};
  if (site) {
    for (const l of lots) {
      qr[l.id] = await QRCode.toString(`${site}/lot/${encodeURIComponent(l.code)}`, {
        type: "svg",
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: "#2b1d0e", light: "#ffffff" },
      });
    }
  }
  const products = listAdminProducts().map((p) => ({ id: p.id, name: p.name }));
  return (
    <>
      <AdminTop />
      <LotManager lots={lots} products={products} qr={qr} hasSite={Boolean(site)} />
    </>
  );
}
