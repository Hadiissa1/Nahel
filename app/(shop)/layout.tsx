import { getCatalog } from "@/lib/products";
import { CatalogProvider } from "@/components/CatalogProvider";
import { CartProvider } from "@/components/CartProvider";
import { Cart } from "@/components/Cart";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  // Cached and shared by all visitors; expired when the admin changes products.
  const products = await getCatalog();
  return (
    <CatalogProvider products={products}>
      <CartProvider>
        {children}
        <Cart />
      </CartProvider>
    </CatalogProvider>
  );
}
