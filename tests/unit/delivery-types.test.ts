import { describe, expect, it } from "vitest";
import { deliveryFee, type DeliveryZone } from "@/lib/delivery-types";

const zone = (fee: number | null, freeFrom: number | null): DeliveryZone => ({
  id: "z",
  name: { en: "Beirut", ar: "بيروت" },
  fee,
  freeFrom,
});

describe("deliveryFee", () => {
  it("charges the zone fee", () => {
    expect(deliveryFee(zone(300, null), 2000)).toBe(300);
  });

  it("is free from the zone threshold", () => {
    expect(deliveryFee(zone(300, 5000), 5000)).toBe(0);
    expect(deliveryFee(zone(300, 5000), 8000)).toBe(0);
  });

  it("charges the fee just under the threshold", () => {
    expect(deliveryFee(zone(300, 5000), 4999)).toBe(300);
  });

  it("charges the fee when the goods total is unknown (price on request)", () => {
    expect(deliveryFee(zone(300, 5000), null)).toBe(300);
  });

  it("returns null when the fee is to be confirmed on WhatsApp", () => {
    expect(deliveryFee(zone(null, null), 2000)).toBeNull();
  });

  it("is still free above the threshold even if the fee is to be confirmed", () => {
    expect(deliveryFee(zone(null, 5000), 6000)).toBe(0);
  });
});
