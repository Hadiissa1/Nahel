import "server-only";
import { randomUUID } from "node:crypto";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import type { AdminZone, DeliveryZone } from "@/lib/delivery-types";

export const ZONES_TAG = "delivery-zones";

interface Row {
  id: string;
  name_ar: string;
  name_en: string;
  fee: number | null;
  free_from: number | null;
  active: number;
}

const toZone = (r: Row): AdminZone => ({
  id: r.id,
  name: { ar: r.name_ar, en: r.name_en },
  fee: r.fee,
  freeFrom: r.free_from,
  active: r.active === 1,
});

function load(where = ""): AdminZone[] {
  return (
    db().prepare(`SELECT * FROM delivery_zones ${where} ORDER BY sort, created_at`).all() as unknown as Row[]
  ).map(toZone);
}

/** Zones shown at checkout. Cached; admin changes expire it at once. */
export async function getDeliveryZones(): Promise<DeliveryZone[]> {
  "use cache";
  cacheTag(ZONES_TAG);
  cacheLife("minutes");
  return load("WHERE active = 1").map(({ id, name, fee, freeFrom }) => ({ id, name, fee, freeFrom }));
}

/** Fresh read for placing an order (never trusts the cache or the browser). */
export function activeZones(): DeliveryZone[] {
  return load("WHERE active = 1");
}

export function listAdminZones(): AdminZone[] {
  return load();
}

export interface ZoneInput {
  name: { ar: string; en: string };
  fee: number | null;
  freeFrom: number | null;
  active: boolean;
}

/** Create (no id) or update a zone. Returns false when the zone to update is gone. */
export function saveZone(id: string | null, z: ZoneInput): boolean {
  const d = db();
  if (!id) {
    const { m } = d.prepare("SELECT COALESCE(MAX(sort), -1) + 1 AS m FROM delivery_zones").get() as { m: number };
    d.prepare(
      "INSERT INTO delivery_zones (id, name_ar, name_en, fee, free_from, active, sort) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run(randomUUID(), z.name.ar, z.name.en, z.fee, z.freeFrom, z.active ? 1 : 0, m);
    return true;
  }
  const r = d
    .prepare("UPDATE delivery_zones SET name_ar = ?, name_en = ?, fee = ?, free_from = ?, active = ? WHERE id = ?")
    .run(z.name.ar, z.name.en, z.fee, z.freeFrom, z.active ? 1 : 0, id);
  return Number(r.changes) > 0;
}

export function deleteZone(id: string): boolean {
  return Number(db().prepare("DELETE FROM delivery_zones WHERE id = ?").run(id).changes) > 0;
}
