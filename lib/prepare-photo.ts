"use client";

const MAX_SIDE = 1600;
export const MAX_UPLOAD = 4 * 1024 * 1024;

/**
 * Shrink a camera/gallery photo in the browser before upload: phone photos are
 * often 5–12 MB, this sends ~300 KB instead (fast on mobile data). The server
 * re-encodes it again in any case.
 */
export async function preparePhoto(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.86));
    if (blob) return new File([blob], "photo.jpg", { type: "image/jpeg" });
  } catch {
    /* browser can't decode it: fall back to the original file */
  }
  return file;
}
