import { describe, expect, it } from "vitest";
import { activeZones, deleteZone, getDeliveryZones, listAdminZones, saveZone } from "@/lib/delivery";
import { clearZones, makeZone } from "../setup/fixtures";

describe("delivery zones", () => {
  it("start with the starter zones", async () => {
    expect((await listAdminZones()).length).toBeGreaterThan(0);
  });

  it("show only active zones at checkout, in the order they were added", async () => {
    await clearZones();
    const a = await makeZone({ fee: 300 });
    const off = await makeZone({ active: false });
    const b = await makeZone({ fee: null, freeFrom: 5000 });
    expect((await getDeliveryZones()).map((z) => z.id)).toEqual([a.id, b.id]);
    expect((await activeZones()).map((z) => z.id)).toEqual([a.id, b.id]);
    expect((await listAdminZones()).map((z) => z.id)).toEqual([a.id, off.id, b.id]);
    expect(await getDeliveryZones()).toContainEqual({ id: b.id, name: b.name, fee: null, freeFrom: 5000 });
  });

  it("can be edited, paused and deleted", async () => {
    await clearZones();
    const z = await makeZone({ fee: 300 });
    expect(await saveZone(z.id, { name: { en: "Beirut", ar: "بيروت" }, fee: 500, freeFrom: 8000, active: false })).toBe(true);
    expect(await listAdminZones()).toEqual([
      { id: z.id, name: { en: "Beirut", ar: "بيروت" }, fee: 500, freeFrom: 8000, active: false },
    ]);
    expect(await activeZones()).toEqual([]);
    expect(await deleteZone(z.id)).toBe(true);
    expect(await deleteZone(z.id)).toBe(false);
    expect(await saveZone(z.id, { name: { en: "x", ar: "x" }, fee: 1, freeFrom: null, active: true })).toBe(false);
  });
});
