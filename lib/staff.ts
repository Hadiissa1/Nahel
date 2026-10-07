import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { endSessionsOf, hashPassword } from "@/lib/auth";

export const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{1,28}[a-z0-9]$/;

export interface StaffAccount {
  id: string;
  username: string;
  name: string;
  active: boolean;
  lastLogin: string | null;
  createdAt: string;
}

interface Row {
  id: string;
  username: string;
  name: string;
  active: number;
  last_login: string | null;
  created_at: string;
}

export function listStaff(): StaffAccount[] {
  return (db().prepare("SELECT * FROM staff ORDER BY created_at").all() as unknown as Row[]).map((r) => ({
    id: r.id,
    username: r.username,
    name: r.name,
    active: r.active === 1,
    lastLogin: r.last_login,
    createdAt: r.created_at,
  }));
}

export function createStaff(input: { username: string; name: string; password: string }): "ok" | "taken" {
  const r = db()
    .prepare("INSERT INTO staff (id, username, name, pw_hash) VALUES (?, ?, ?, ?) ON CONFLICT(username) DO NOTHING")
    .run(randomUUID(), input.username, input.name, hashPassword(input.password));
  return Number(r.changes) > 0 ? "ok" : "taken";
}

/** Disabling (or re-enabling) ends the person's open sessions at once. */
export function setStaffActive(id: string, active: boolean): boolean {
  const ok = Number(db().prepare("UPDATE staff SET active = ? WHERE id = ?").run(active ? 1 : 0, id).changes) > 0;
  if (ok) endSessionsOf(id);
  return ok;
}

export function setStaffPassword(id: string, password: string): boolean {
  const ok =
    Number(db().prepare("UPDATE staff SET pw_hash = ? WHERE id = ?").run(hashPassword(password), id).changes) > 0;
  if (ok) endSessionsOf(id);
  return ok;
}

export function deleteStaff(id: string): boolean {
  endSessionsOf(id);
  return Number(db().prepare("DELETE FROM staff WHERE id = ?").run(id).changes) > 0;
}
