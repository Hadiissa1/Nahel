import "server-only";
import { randomUUID } from "node:crypto";
import { deleteFiles, getFile, putFile } from "@/lib/file-store";

/** Lab analysis certificates (PDF). */
export const MAX_DOC_BYTES = 4 * 1024 * 1024;
const FILE_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/;

export class DocError extends Error {}

/** Store an uploaded PDF under a random name; only real PDF files are accepted. */
export async function saveDoc(file: File): Promise<string> {
  if (file.size === 0) throw new DocError("empty");
  if (file.size > MAX_DOC_BYTES) throw new DocError("too_large");
  const bytes = new Uint8Array(await file.arrayBuffer());
  // Check the content, not the name or the browser-declared type.
  if (String.fromCharCode(...bytes.subarray(0, 5)) !== "%PDF-") throw new DocError("format");
  const name = `${randomUUID()}.pdf`;
  await putFile(`docs/${name}`, bytes, "application/pdf");
  return name;
}

export async function deleteDoc(name: string | null | undefined) {
  if (!name || !FILE_RE.test(name)) return;
  await deleteFiles([`docs/${name}`]);
}

/** Read a stored PDF; null for anything that isn't one of our file names. */
export async function readDoc(name: string): Promise<ArrayBuffer | null> {
  if (!FILE_RE.test(name)) return null;
  return (await getFile(`docs/${name}`))?.body ?? null;
}
