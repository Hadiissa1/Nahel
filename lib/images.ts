import "server-only";

/**
 * Resize / re-encode images. On Cloudflare: the Images binding `IMAGES`
 * (see wrangler.jsonc). Elsewhere: sharp. Returns null when no image
 * service can handle the file, so callers can fall back.
 */

export interface ImageOut {
  bytes: Uint8Array;
  contentType: string;
}

export interface ImageJob {
  width: number;
  height: number;
  /** "inside": fit within the box, never enlarged. "cover": fill the box, cropped. */
  fit: "inside" | "cover";
  format: "webp" | "jpeg";
  quality: number;
}

/** Minimal shape of the Cloudflare Images binding. */
interface ImagesLike {
  input(stream: ReadableStream): {
    transform(t: { width: number; height: number; fit: string }): {
      output(o: { format: string; quality: number }): Promise<{ response(): Response }>;
    };
  };
}

const CF_CONTEXT = Symbol.for("__cloudflare-context__");
const cf = () => (globalThis as unknown as { [CF_CONTEXT]?: { env?: { IMAGES?: ImagesLike } } })[CF_CONTEXT];

const streamOf = (bytes: Uint8Array) =>
  new ReadableStream({
    start(c) {
      c.enqueue(bytes);
      c.close();
    },
  });

export async function transformImage(input: Uint8Array, job: ImageJob): Promise<ImageOut | null> {
  const ctx = cf();
  if (ctx) {
    const images = ctx.env?.IMAGES;
    if (!images) return null;
    try {
      const out = await images
        .input(streamOf(input))
        .transform({ width: job.width, height: job.height, fit: job.fit === "cover" ? "cover" : "scale-down" })
        .output({ format: `image/${job.format}`, quality: job.quality });
      const res = out.response();
      return { bytes: new Uint8Array(await res.arrayBuffer()), contentType: `image/${job.format}` };
    } catch (e) {
      console.error("image transform failed", e);
      return null;
    }
  }
  try {
    const sharp = (await import(/* webpackIgnore: true */ "sharp")).default;
    let img = sharp(input, { limitInputPixels: 50_000_000, failOn: "error" })
      .rotate()
      .resize(job.width, job.height, job.fit === "cover"
        ? { fit: "cover", position: "attention" }
        : { fit: "inside", withoutEnlargement: true });
    img = job.format === "webp" ? img.webp({ quality: job.quality }) : img.jpeg({ quality: job.quality });
    return { bytes: new Uint8Array(await img.toBuffer()), contentType: `image/${job.format}` };
  } catch {
    return null;
  }
}

/** The image format from the file's first bytes (not its name or declared type). */
export function sniffImage(b: Uint8Array): "jpeg" | "png" | "webp" | "gif" | "avif" | "heif" | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...b.subarray(from, to));
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (b[0] === 0x89 && ascii(1, 4) === "PNG") return "png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  if (ascii(0, 3) === "GIF") return "gif";
  if (ascii(4, 8) === "ftyp") {
    const brand = ascii(8, 12);
    if (brand.startsWith("avi")) return "avif";
    if (/^(heic|heix|mif1|msf1|hevc)/.test(brand)) return "heif";
  }
  return null;
}
