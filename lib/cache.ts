import "server-only";
import { unstable_cache } from "next/cache";

/** How long shop data stays cached when nothing changes it (seconds). */
export const CACHE_SECONDS = 60;

/**
 * Shop data shared by every visitor, cached for a minute. Admin changes
 * expire it at once through its tag (updateTag / revalidateTag). Results are
 * stored as JSON, so they must be plain data.
 */
export function cached<A extends unknown[], R>(fn: (...args: A) => Promise<R>, key: string, tag: string) {
  return unstable_cache(fn, [key], { tags: [tag], revalidate: CACHE_SECONDS });
}
