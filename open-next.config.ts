// OpenNext adapter settings: how Next.js caches work on Cloudflare Workers.
// See https://opennext.js.org/cloudflare/caching
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";

export default defineCloudflareConfig({
  // Cached pages and "use cache" data, kept in R2 (prefix "incremental-cache/").
  incrementalCache: r2IncrementalCache,
  // updateTag()/revalidateTag() bookkeeping, kept in D1 (table "revalidations").
  tagCache: d1NextTagCache,
  queue: memoryQueue,
});
