import { connection } from "next/server";
import { readDoc } from "@/lib/doc-store";

/**
 * Lab analysis PDFs. Sent as a download (opened by the phone's or computer's
 * PDF app), so a PDF is never rendered as part of our site.
 */
export async function GET(_req: Request, ctx: RouteContext<"/docs/[file]">) {
  await connection();
  const { file } = await ctx.params;
  const data = await readDoc(file);
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(data, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="nahel-analysis.pdf"`,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
