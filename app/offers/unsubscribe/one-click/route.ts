import { unsubscribe } from "@/lib/subscribers";

/**
 * RFC 8058 one-click unsubscribe: mail apps (Gmail, Apple Mail…) POST here
 * when the reader taps "Unsubscribe" next to the sender's name.
 */
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  await unsubscribe(token);
  // Same answer either way: don't reveal whether the token existed.
  return new Response("Unsubscribed", { status: 200 });
}
