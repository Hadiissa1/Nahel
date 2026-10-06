"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { LocalizedText } from "@/lib/data";

export interface CartItem {
  id: string;
  name: LocalizedText;
  category: LocalizedText;
  qty: number;
  price?: number; // optional — set prices in lib/data.ts to show totals
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  hasPrices: boolean;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (item: Omit<CartItem, "qty">) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "nahel-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);

  // Restore cart on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setItems(parsed);
        }
      }
    } catch {
      /* ignore unavailable/corrupt storage */
    }
  }, []);

  // Persist on change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const add = useCallback((item: Omit<CartItem, "qty">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i,
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
    setOpen(true);
  }, []);

  const remove = useCallback(
    (id: string) => setItems((prev) => prev.filter((i) => i.id !== id)),
    [],
  );

  const setQty = useCallback((id: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, qty } : i)),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((n, i) => n + i.qty, 0), [items]);
  const hasPrices = useMemo(
    () => items.length > 0 && items.every((i) => typeof i.price === "number"),
    [items],
  );
  const total = useMemo(
    () => items.reduce((sum, i) => sum + (i.price ?? 0) * i.qty, 0),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count,
      total,
      hasPrices,
      open,
      setOpen,
      add,
      remove,
      setQty,
      clear,
    }),
    [items, count, total, hasPrices, open, add, remove, setQty, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
