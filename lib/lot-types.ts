import type { LocalizedText } from "@/lib/data";

/** A batch (lot) of a product, as customers see it. */
export interface Lot {
  id: string;
  code: string;
  productId: string;
  /** YYYY-MM-DD, or null. */
  harvestOn: string | null;
  region: LocalizedText;
  notes: LocalizedText;
  /** URL of the lab analysis PDF, or null. */
  certificateUrl: string | null;
}

export interface AdminLot extends Lot {
  productName: LocalizedText;
  current: boolean;
  certificate: string | null;
}

/** Lot codes: what is printed on the jar. Upper-case letters, digits and dashes. */
export const LOT_CODE_RE = /^[A-Z0-9][A-Z0-9-]{1,28}[A-Z0-9]$/;

export function normalizeLotCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase().replace(/\s+/g, "-");
  return LOT_CODE_RE.test(code) ? code : null;
}

export const docUrl = (file: string) => `/docs/${file}`;
