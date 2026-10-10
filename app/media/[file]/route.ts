import { readPhoto } from "@/lib/photo-store";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/media/[file]">,
) {
  const { file } = await ctx.params;
  const photo = await readPhoto(file);
  if (!photo) return new Response("Not found", { status: 404 });
  return new Response(photo.body, {
    headers: {
      // Usually WebP; a photo kept as uploaded may be JPEG or PNG.
      "Content-Type": photo.contentType,
      // File names are random per upload, so a stored photo never changes.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
