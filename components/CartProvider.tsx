"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { findEntry, type CatalogEntry } from "@/lib/catalog";

export const MAX_QTY = 99;
const MAX_LINES = 100;
const STORAGE_KEY = "nahel-cart";

/** What is stored: only references into the catalog, never names or prices. */
interface StoredLine {
  id: string;
  variant?: string;
  qty: number;
}

/** What the UI uses: a stored line resolved against the catalog. */
export interface CartLine extends StoredLine {
  key: string;
  entry: CatalogEntry;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  total: number;
  hasPrices: boolean;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (id: string, variant?: string) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const lineKey = (id: string, variant?: string) =>
  variant ? `${id}:${variant}` : id;

const clampQty = (n: number) => Math.min(MAX_QTY, Math.max(1, Math.floor(n)));

/**
 * Accept only lines that point at a real product (and a real variant of it),
 * with a sane quantity. Anything else in storage (stale, corrupt or tampered
 * data) is dropped.
 */
function sanitize(raw: unknown): StoredLine[] {
  if (!Array.isArray(raw)) return [];
  const out = new Map<string, StoredLine>();
  for (const item of raw.slice(0, MAX_LINES)) {
    if (!item || typeof item !== "object") continue;
    const { id, variant, qty } = item as Record<string, unknown>;
    if (typeof id !== "string" || typeof qty !== "number" || !Number.isFinite(qty))
      continue;
    const entry = findEntry(id);
    if (!entry || qty < 1) continue;
    const v = typeof variant === "string" ? variant : undefined;
    if (entry.variants ? !v || !entry.variants.includes(v) : v !== undefined)
      continue;
    out.set(lineKey(id, v), { id, variant: v, qty: clampQty(qty) });
  }
  return [...out.values()];
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [stored, setStored] = useState<StoredLine[]>([]);
  const [open, setOpen] = useState(false);

  // Restore cart on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStored(sanitize(JSON.parse(raw)));
      }
    } catch {
      /* unavailable or corrupt storage: start empty */
    }
  }, []);

  // Persist on change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      /* ignore */
    }
  }, [stored]);

  const add = useCallback((id: string, variant?: string) => {
    const entry = findEntry(id);
    if (!entry) return;
    if (entry.variants && (!variant || !entry.variants.includes(variant))) return;
    setStored((prev) => {
      const k = lineKey(id, variant);
      const existing = prev.find((l) => lineKey(l.id, l.variant) === k);
      if (existing) {
        return prev.map((l) =>
          l === existing ? { ...l, qty: clampQty(l.qty + 1) } : l,
        );
      }
      if (prev.length >= MAX_LINES) return prev;
      return [...prev, { id, variant, qty: 1 }];
    });
    setOpen(true);
  }, []);

  const remove = useCallback(
    (key: string) =>
      setStored((prev) => prev.filter((l) => lineKey(l.id, l.variant) !== key)),
    [],
  );

  const setQty = useCallback((key: string, qty: number) => {
    setStored((prev) =>
      qty < 1
        ? prev.filter((l) => lineKey(l.id, l.variant) !== key)
        : prev.map((l) =>
            lineKey(l.id, l.variant) === key ? { ...l, qty: clampQty(qty) } : l,
          ),
    );
  }, []);

  const clear = useCallback(() => setStored([]), []);

  const lines = useMemo<CartLine[]>(
    () =>
      stored.flatMap((l) => {
        const entry = findEntry(l.id);
        return entry ? [{ ...l, key: lineKey(l.id, l.variant), entry }] : [];
      }),
    [stored],
  );

  const count = useMemo(() => lines.reduce((n, l) => n + l.qty, 0), [lines]);
  const hasPrices = useMemo(
    () =>
      lines.length > 0 &&
      lines.every((l) => typeof l.entry.product.price === "number"),
    [lines],
  );
  const total = useMemo(
    () => lines.reduce((sum, l) => sum + (l.entry.product.price ?? 0) * l.qty, 0),
    [lines],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
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
    [lines, count, total, hasPrices, open, add, remove, setQty, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
