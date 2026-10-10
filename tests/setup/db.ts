import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { afterAll, beforeEach } from "vitest";

// Never touch the shop's real data: every test file gets its own temp folder.
// lib/db.ts reads DATA_DIR once when it loads, so the folder stays the same
// for the whole file and is emptied before each test instead.
const dir = mkdtempSync(path.join(tmpdir(), "nahel-test-"));
process.env.DATA_DIR = dir;

// Keep real services out of tests, whatever the developer's shell has set.
delete process.env.BREVO_API_KEY;
delete process.env.MAIL_DRIVER;
delete process.env.MAIL_FROM_EMAIL;
delete process.env.SITE_URL;
delete process.env.ADMIN_PASSWORD;

const g = globalThis as unknown as { __nahelDb?: unknown; __nahelSqlite?: DatabaseSync };

function closeDb() {
  g.__nahelSqlite?.close();
  g.__nahelSqlite = undefined;
  g.__nahelDb = undefined;
}

// A fresh database for every test (lib/db.ts reopens and re-seeds it lazily).
beforeEach(() => {
  closeDb();
  rmSync(dir, { recursive: true, force: true });
});

afterAll(() => {
  closeDb();
  rmSync(dir, { recursive: true, force: true });
});
