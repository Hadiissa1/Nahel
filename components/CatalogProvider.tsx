"use client";

import { createContext, useContext, useMemo } from "react";
import type { CatalogProduct } from "@/lib/catalog-types";

interface CatalogValue {
  products: CatalogProduct[];
  byId: Map<string, CatalogProduct>;
}

const CatalogContext = createContext<CatalogValue | null>(null);

/** Makes the server-loaded catalog available to the shop's client components. */
export function CatalogProvider({
  products,
  children,
}: {
  products: CatalogProduct[];
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({ products, byId: new Map(products.map((p) => [p.id, p])) }),
    [products],
  );
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used within CatalogProvider");
  return ctx;
}
