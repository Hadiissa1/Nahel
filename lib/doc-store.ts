import "server-only";
import { randomUUID } from "node:crypto";
import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { DOCS_DIR, db } from "@/lib/db";

/** Lab analysis certificates (PDF), stored next to the database. */
export const MAX_DOC_BYTES = 4 * 1024 * 1024;
const FILE_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/;

export class DocError extends Error {}

/** Store an uploaded PDF under a random name; only real PDF files are accepted. */
export async function saveDoc(file: File): Promise<string> {
  if (file.size === 0) throw new DocError("empty");
  if (file.size > MAX_DOC_BYTES) throw new DocError("too_large");
  const bytes = Buffer.from(await file.arrayBuffer());
  // Check the content, not the name or the browser-declared type.
  if (bytes.subarray(0, 5).toString("latin1") !== "%PDF-") throw new DocError("format");
  db(); // make sure DOCS_DIR exists
  const name = `${randomUUID()}.pdf`;
  await writeFile(path.join(DOCS_DIR, name), bytes, { flag: "wx" });
  return name;
}

export async function deleteDoc(name: string | null | undefined) {
  if (!name || !FILE_RE.test(name)) return;
  await rm(path.join(DOCS_DIR, name), { force: true });
}

/** Read a stored PDF; null for anything that isn't one of our file names. */
export async function readDoc(name: string): Promise<Buffer | null> {
  if (!FILE_RE.test(name)) return null;
  try {
    return await readFile(path.join(DOCS_DIR, name));
  } catch {
    return null;
  }
}
