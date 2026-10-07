import { readPhoto } from "@/lib/photo-store";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/media/[file]">,
) {
  const { file } = await ctx.params;
  const data = await readPhoto(file);
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/webp",
      // File names are random per upload, so a stored photo never changes.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
