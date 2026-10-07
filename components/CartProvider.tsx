"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useCatalog } from "@/components/CatalogProvider";
import {
  MAX_CART_QTY,
  isOutOfStock,
  type CatalogProduct,
  type Variant,
} from "@/lib/catalog-types";

const MAX_LINES = 100;
const STORAGE_KEY = "nahel-cart";

/** What is stored: only references into the catalog, never names or prices. */
interface StoredLine {
  id: string;
  variant: string;
  qty: number;
}

/** A stored line resolved against the current catalog. */
export interface CartLine extends StoredLine {
  key: string;
  product: CatalogProduct;
  option: Variant;
  /** Most this line can hold: stock (when tracked), capped at MAX_CART_QTY. */
  max: number;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  total: number;
  hasPrices: boolean;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (productId: string, variantId: string) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const lineKey = (id: string, variant: string) => `${id}:${variant}`;
const maxFor = (v: Variant) => (v.stock === null ? MAX_CART_QTY : Math.min(MAX_CART_QTY, v.stock));

/** Find the option a stored line refers to (by id; by label for carts saved by older versions). */
function findOption(p: CatalogProduct, ref: string) {
  return p.variants.find((v) => v.id === ref) ?? p.variants.find((v) => v.label && v.label === ref);
}

/**
 * Accept only lines that point at a real product option with a sane quantity.
 * Anything else in storage (stale, corrupt or tampered data) is dropped.
 */
function sanitize(raw: unknown, byId: Map<string, CatalogProduct>): StoredLine[] {
  if (!Array.isArray(raw)) return [];
  const out = new Map<string, StoredLine>();
  for (const item of raw.slice(0, MAX_LINES)) {
    if (!item || typeof item !== "object") continue;
    const { id, variant, qty } = item as Record<string, unknown>;
    if (typeof id !== "string" || typeof qty !== "number" || !Number.isFinite(qty) || qty < 1)
      continue;
    const product = byId.get(id);
    if (!product) continue;
    const option =
      typeof variant === "string"
        ? findOption(product, variant)
        : product.variants.length === 1
          ? product.variants[0]
          : undefined;
    if (!option || isOutOfStock(option)) continue;
    out.set(lineKey(id, option.id), {
      id,
      variant: option.id,
      qty: Math.min(maxFor(option), Math.floor(qty)),
    });
  }
  return [...out.values()];
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { byId } = useCatalog();
  const [stored, setStored] = useState<StoredLine[]>([]);
  const [open, setOpen] = useState(false);
  const [restored, setRestored] = useState(false);

  // Restore the cart on mount. As a transition, so that streamed parts of the
  // page still hydrating against the server HTML are not re-rendered early
  // (which React reports as a hydration mismatch).
  useEffect(() => {
    let saved: StoredLine[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) saved = sanitize(JSON.parse(raw), byId);
    } catch {
      /* unavailable or corrupt storage: start empty */
    }
    startTransition(() => {
      setStored(saved);
      setRestored(true);
    });
    // Restore once; later catalog changes are applied in `lines` below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on change (not before the first restore, or we'd wipe it).
  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      /* ignore */
    }
  }, [stored, restored]);

  // Resolve against the live catalog: removed or sold-out options disappear,
  // quantities never exceed what is in stock.
  const lines = useMemo<CartLine[]>(
    () =>
      stored.flatMap((l) => {
        const product = byId.get(l.id);
        const option = product && findOption(product, l.variant);
        if (!product || !option || isOutOfStock(option)) return [];
        const max = maxFor(option);
        return [{ ...l, qty: Math.min(l.qty, max), key: lineKey(l.id, option.id), product, option, max }];
      }),
    [stored, byId],
  );

  const add = useCallback(
    (productId: string, variantId: string) => {
      const product = byId.get(productId);
      const option = product && findOption(product, variantId);
      if (!option || isOutOfStock(option)) return;
      const k = lineKey(productId, option.id);
      setStored((prev) => {
        const existing = prev.find((l) => lineKey(l.id, l.variant) === k);
        if (existing) {
          return prev.map((l) =>
            l === existing ? { ...l, qty: Math.min(maxFor(option), l.qty + 1) } : l,
          );
        }
        if (prev.length >= MAX_LINES) return prev;
        return [...prev, { id: productId, variant: option.id, qty: 1 }];
      });
      setOpen(true);
    },
    [byId],
  );

  const remove = useCallback(
    (key: string) => setStored((prev) => prev.filter((l) => lineKey(l.id, l.variant) !== key)),
    [],
  );

  const setQty = useCallback(
    (key: string, qty: number) => {
      setStored((prev) =>
        qty < 1
          ? prev.filter((l) => lineKey(l.id, l.variant) !== key)
          : prev.map((l) => {
              if (lineKey(l.id, l.variant) !== key) return l;
              const option = byId.get(l.id) && findOption(byId.get(l.id)!, l.variant);
              const max = option ? maxFor(option) : MAX_CART_QTY;
              return { ...l, qty: Math.min(max, Math.floor(qty)) };
            }),
      );
    },
    [byId],
  );

  const clear = useCallback(() => setStored([]), []);

  const count = useMemo(() => lines.reduce((n, l) => n + l.qty, 0), [lines]);
  const hasPrices = useMemo(
    () => lines.length > 0 && lines.every((l) => l.option.price !== null),
    [lines],
  );
  const total = useMemo(
    () => lines.reduce((sum, l) => sum + (l.option.price ?? 0) * l.qty, 0),
    [lines],
  );

  const value = useMemo<CartContextValue>(
    () => ({ lines, count, total, hasPrices, open, setOpen, add, remove, setQty, clear }),
    [lines, count, total, hasPrices, open, add, remove, setQty, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
