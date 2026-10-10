import "server-only";
import { DATA_DIR } from "@/lib/db";
import { sniffImage } from "@/lib/images";

/**
 * Uploaded files (product photos, lab PDFs). Two places behind one API:
 * - on Cloudflare: the R2 bucket bound as `FILES` (see wrangler.jsonc);
 * - anywhere else (local dev, tests): files under DATA_DIR.
 * Keys look like "uploads/<name>" or "docs/<name>"; callers validate names.
 */

export interface StoredFile {
  body: ArrayBuffer;
  contentType: string;
}

/** Minimal shape of the Cloudflare R2 binding. */
interface R2Like {
  put(key: string, value: ArrayBuffer | Uint8Array, opts?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer>; httpMetadata?: { contentType?: string } } | null>;
  delete(keys: string | string[]): Promise<void>;
}

const CF_CONTEXT = Symbol.for("__cloudflare-context__");
const bucket = () =>
  (globalThis as unknown as { [CF_CONTEXT]?: { env?: { FILES?: R2Like } } })[CF_CONTEXT]?.env?.FILES;

async function fs() {
  return import(/* webpackIgnore: true */ "node:fs/promises");
}

export async function putFile(key: string, body: Uint8Array, contentType: string): Promise<void> {
  const r2 = bucket();
  if (r2) {
    await r2.put(key, body, { httpMetadata: { contentType } });
    return;
  }
  const { mkdir, writeFile } = await fs();
  const path = `${DATA_DIR}/${key}`;
  await mkdir(path.slice(0, path.lastIndexOf("/")), { recursive: true });
  // The type isn't stored locally: it is read back from the content.
  await writeFile(path, body);
}

export async function getFile(key: string): Promise<StoredFile | null> {
  const r2 = bucket();
  if (r2) {
    const obj = await r2.get(key);
    if (!obj) return null;
    return { body: await obj.arrayBuffer(), contentType: obj.httpMetadata?.contentType ?? "application/octet-stream" };
  }
  const { readFile } = await fs();
  try {
    const path = `${DATA_DIR}/${key}`;
    const data = await readFile(path);
    return {
      body: data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer,
      contentType: typeOf(new Uint8Array(data)),
    };
  } catch {
    return null;
  }
}

export async function deleteFiles(keys: string[]): Promise<void> {
  if (!keys.length) return;
  const r2 = bucket();
  if (r2) {
    await r2.delete(keys);
    return;
  }
  const { rm } = await fs();
  await Promise.all(keys.map((k) => rm(`${DATA_DIR}/${k}`, { force: true })));
}

function typeOf(b: Uint8Array): string {
  if (String.fromCharCode(...b.subarray(0, 5)) === "%PDF-") return "application/pdf";
  const image = sniffImage(b);
  return image ? `image/${image}` : "application/octet-stream";
}
