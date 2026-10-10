import { connection } from "next/server";
import { transformImage } from "@/lib/images";
import { getProduct } from "@/lib/products";
import { readPhoto } from "@/lib/photo-store";

const W = 1200;
const H = 630;

/** Share preview image for a product: /og/<id>?v=<photo id> (v busts caches). */
export async function GET(_req: Request, ctx: RouteContext<"/og/[id]">) {
  await connection(); // always reflect the current photo
  const { id } = await ctx.params;
  const product = await getProduct(id);
  if (!product) return new Response("Not found", { status: 404 });

  const photo = product.photo ? await readPhoto(`${product.photo}-1600.webp`) : null;
  // No photo: the shop's branded picture (public/og-fallback.jpg).
  if (!photo) return new Response(null, { status: 302, headers: { Location: "/og-fallback.jpg" } });
  const image = await transformImage(new Uint8Array(photo.body), {
    width: W,
    height: H,
    fit: "cover",
    format: "jpeg",
    quality: 82,
  });
  // If it can't be cropped, the photo itself is fine: apps crop previews anyway.
  return new Response(image ? (image.bytes as Uint8Array<ArrayBuffer>) : photo.body, {
    headers: {
      "Content-Type": image ? image.contentType : photo.contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
