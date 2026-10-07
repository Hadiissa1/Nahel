import "server-only";
import { randomUUID } from "node:crypto";
import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { UPLOAD_DIR, db } from "@/lib/db";

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const SIZES = [800, 1600] as const;
const ACCEPTED = new Set(["jpeg", "png", "webp", "gif", "avif", "heif", "tiff"]);
const FILE_RE = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-(800|1600)\.webp$/;

export class PhotoError extends Error {}

/**
 * Decode, auto-rotate and re-encode an uploaded image as WebP in two sizes.
 * Re-encoding drops any non-image payload and all metadata (EXIF, GPS).
 */
export async function savePhoto(file: File): Promise<string> {
  if (file.size === 0) throw new PhotoError("empty");
  if (file.size > MAX_UPLOAD_BYTES) throw new PhotoError("too_large");
  const input = Buffer.from(await file.arrayBuffer());

  let base: ReturnType<typeof sharp>;
  try {
    base = sharp(input, { limitInputPixels: 50_000_000, failOn: "error" });
    const meta = await base.metadata();
    if (!meta.format || !ACCEPTED.has(meta.format)) throw new PhotoError("format");
  } catch (e) {
    throw e instanceof PhotoError ? e : new PhotoError("unreadable");
  }

  // ensure the data dir exists before writing
  db();
  const id = randomUUID();
  try {
    for (const size of SIZES) {
      await base
        .clone()
        .rotate()
        .resize(size, size, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: size === 800 ? 78 : 82 })
        .toFile(path.join(UPLOAD_DIR, `${id}-${size}.webp`));
    }
  } catch {
    await deletePhoto(id);
    throw new PhotoError("unreadable");
  }
  return id;
}

export async function deletePhoto(id: string | null) {
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) return;
  await Promise.all(
    SIZES.map((s) => rm(path.join(UPLOAD_DIR, `${id}-${s}.webp`), { force: true })),
  );
}

/** Read a stored photo by its public file name; null when invalid or missing. */
export async function readPhoto(fileName: string): Promise<Buffer | null> {
  if (!FILE_RE.test(fileName)) return null;
  try {
    return await readFile(path.join(UPLOAD_DIR, fileName));
  } catch {
    return null;
  }
}
