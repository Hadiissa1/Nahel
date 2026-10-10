import { connection } from "next/server";
import { getCatalog } from "@/lib/products";
import { getDeliveryZones } from "@/lib/delivery";
import { CatalogProvider } from "@/components/CatalogProvider";
import { CartProvider } from "@/components/CartProvider";
import { Cart } from "@/components/Cart";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { VisitCounter } from "@/components/VisitCounter";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  // Shop pages are built when visited, never at `next build`: the build only
  // sees a starter database, not the shop's real one (Cloudflare D1).
  await connection();
  // Cached and shared by all visitors; expired when the admin changes products.
  const [products, zones] = await Promise.all([getCatalog(), getDeliveryZones()]);
  return (
    <CatalogProvider products={products}>
      <CartProvider>
        {children}
        <WhatsAppButton />
        <VisitCounter />
        <Cart zones={zones} />
      </CartProvider>
    </CatalogProvider>
  );
}
