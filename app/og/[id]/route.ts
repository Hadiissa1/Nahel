import { connection } from "next/server";
import sharp from "sharp";
import { getProduct } from "@/lib/products";
import { readPhoto } from "@/lib/photo-store";

const W = 1200;
const H = 630;

/** Branded fallback for products without a photo (no text: no font needed). */
const FALLBACK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f0b740"/><stop offset="0.55" stop-color="#d99a18"/><stop offset="1" stop-color="#b9740f"/>
    </linearGradient>
    <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="2" fill="#fff" fill-opacity="0.22"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>
  <g transform="translate(600 315)" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">
    <path d="M-60 -150h120M-45 -150v35c0 10-4 18-10 24l-22 24c-10 10-16 22-16 36v140c0 22 18 40 40 40h106c22 0 40-18 40-40v-140c0-14-6-26-16-36l-22-24c-6-6-10-14-10-24v-35"/>
    <path d="M-93 -10h186M-40 45c13-12 25-12 40 0s27 12 40 0"/>
  </g>
</svg>`;

/** Share preview image for a product: /og/<id>?v=<photo id> (v busts caches). */
export async function GET(_req: Request, ctx: RouteContext<"/og/[id]">) {
  await connection(); // always reflect the current photo
  const { id } = await ctx.params;
  const product = await getProduct(id);
  if (!product) return new Response("Not found", { status: 404 });

  const photo = product.photo ? await readPhoto(`${product.photo}-1600.webp`) : null;
  const image = photo
    ? await sharp(photo).resize(W, H, { fit: "cover", position: "attention" }).jpeg({ quality: 82 }).toBuffer()
    : await sharp(Buffer.from(FALLBACK_SVG)).jpeg({ quality: 85 }).toBuffer();

  return new Response(new Uint8Array(image), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
