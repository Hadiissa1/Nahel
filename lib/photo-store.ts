import "server-only";
import { randomUUID } from "node:crypto";
import { deleteFiles, getFile, putFile, type StoredFile } from "@/lib/file-store";
import { sniffImage, transformImage } from "@/lib/images";

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const SIZES = [800, 1600] as const;
const FILE_RE = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-(800|1600)\.webp$/;
/** Formats stored as they are when no image service can re-encode them. */
const STORABLE = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;

export class PhotoError extends Error {}

const key = (id: string, size: number) => `uploads/${id}-${size}.webp`;

/**
 * Store an uploaded image in two sizes, re-encoded as WebP. Re-encoding
 * drops any non-image payload and all metadata (EXIF, GPS). If the image
 * service is unavailable, a JPEG/PNG/WebP is kept as sent: the admin page
 * already shrank it and removed its metadata in the browser.
 */
export async function savePhoto(file: File): Promise<string> {
  if (file.size === 0) throw new PhotoError("empty");
  if (file.size > MAX_UPLOAD_BYTES) throw new PhotoError("too_large");
  const input = new Uint8Array(await file.arrayBuffer());
  const format = sniffImage(input);
  if (!format) throw new PhotoError("format");

  const id = randomUUID();
  try {
    for (const size of SIZES) {
      const out = await transformImage(input, {
        width: size,
        height: size,
        fit: "inside",
        format: "webp",
        quality: size === 800 ? 78 : 82,
      });
      if (out) await putFile(key(id, size), out.bytes, out.contentType);
      else if (format in STORABLE) await putFile(key(id, size), input, STORABLE[format as keyof typeof STORABLE]);
      else throw new PhotoError("unreadable");
    }
  } catch (e) {
    await deletePhoto(id);
    throw e instanceof PhotoError ? e : new PhotoError("unreadable");
  }
  return id;
}

export async function deletePhoto(id: string | null) {
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) return;
  await deleteFiles(SIZES.map((s) => key(id, s)));
}

/** Read a stored photo by its public file name; null when invalid or missing. */
export async function readPhoto(fileName: string): Promise<StoredFile | null> {
  if (!FILE_RE.test(fileName)) return null;
  return getFile(`uploads/${fileName}`);
}
