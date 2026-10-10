import { clientIp, memoryRateLimiter } from "@/lib/rate-limit";
import { normalizePath, recordView } from "@/lib/analytics";

const perIp = memoryRateLimiter(120, 60 * 1000);

/** Page-view beacon from the shop (see components/VisitCounter.tsx). */
export async function POST(req: Request) {
  // Respect "do not track" / Global Privacy Control.
  if (req.headers.get("dnt") === "1" || req.headers.get("sec-gpc") === "1") return new Response(null, { status: 204 });
  const text = (await req.text()).slice(0, 500);
  let path: string | null = null;
  try {
    path = normalizePath((JSON.parse(text) as { p?: unknown }).p);
  } catch {
    /* ignore malformed */
  }
  const ip = await clientIp();
  if (path && perIp(ip)) await recordView(path, ip, req.headers.get("user-agent") ?? "");
  return new Response(null, { status: 204 });
}
