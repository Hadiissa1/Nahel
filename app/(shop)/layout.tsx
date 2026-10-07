import { getCatalog } from "@/lib/products";
import { getDeliveryZones } from "@/lib/delivery";
import { CatalogProvider } from "@/components/CatalogProvider";
import { CartProvider } from "@/components/CartProvider";
import { Cart } from "@/components/Cart";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  // Cached and shared by all visitors; expired when the admin changes products.
  const [products, zones] = await Promise.all([getCatalog(), getDeliveryZones()]);
  return (
    <CatalogProvider products={products}>
      <CartProvider>
        {children}
        <WhatsAppButton />
        <Cart zones={zones} />
      </CartProvider>
    </CatalogProvider>
  );
}
