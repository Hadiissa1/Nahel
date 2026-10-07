import type { LocalizedText } from "@/lib/data";

/** A delivery area customers can choose at checkout. */
export interface DeliveryZone {
  id: string;
  name: LocalizedText;
  /** Fee in cents; null = "confirmed on WhatsApp". */
  fee: number | null;
  /** Free delivery from this order total (cents), or null. */
  freeFrom: number | null;
}

export interface AdminZone extends DeliveryZone {
  active: boolean;
}

/** Delivery fee for an order of `goods` cents (after discount); null = to confirm. */
export function deliveryFee(zone: DeliveryZone, goods: number | null): number | null {
  if (zone.freeFrom !== null && goods !== null && goods >= zone.freeFrom) return 0;
  return zone.fee;
}
