import { describe, expect, it } from "vitest";
import { activeZones, deleteZone, getDeliveryZones, listAdminZones, saveZone } from "@/lib/delivery";
import { clearZones, makeZone } from "../setup/fixtures";

describe("delivery zones", () => {
  it("start with the starter zones", () => {
    expect(listAdminZones().length).toBeGreaterThan(0);
  });

  it("show only active zones at checkout, in the order they were added", async () => {
    clearZones();
    const a = makeZone({ fee: 300 });
    const off = makeZone({ active: false });
    const b = makeZone({ fee: null, freeFrom: 5000 });
    expect((await getDeliveryZones()).map((z) => z.id)).toEqual([a.id, b.id]);
    expect(activeZones().map((z) => z.id)).toEqual([a.id, b.id]);
    expect(listAdminZones().map((z) => z.id)).toEqual([a.id, off.id, b.id]);
    expect(await getDeliveryZones()).toContainEqual({ id: b.id, name: b.name, fee: null, freeFrom: 5000 });
  });

  it("can be edited, paused and deleted", () => {
    clearZones();
    const z = makeZone({ fee: 300 });
    expect(saveZone(z.id, { name: { en: "Beirut", ar: "بيروت" }, fee: 500, freeFrom: 8000, active: false })).toBe(true);
    expect(listAdminZones()).toEqual([
      { id: z.id, name: { en: "Beirut", ar: "بيروت" }, fee: 500, freeFrom: 8000, active: false },
    ]);
    expect(activeZones()).toEqual([]);
    expect(deleteZone(z.id)).toBe(true);
    expect(deleteZone(z.id)).toBe(false);
    expect(saveZone(z.id, { name: { en: "x", ar: "x" }, fee: 1, freeFrom: null, active: true })).toBe(false);
  });
});
