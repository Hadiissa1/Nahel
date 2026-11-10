// Entry point of the site on Cloudflare (see wrangler.jsonc → "main").
// Sends plain http:// visitors to https://, then hands over to the Next.js
// worker built by OpenNext (.open-next/worker.js, created by `npm run cf:build`).
import site from "./.open-next/worker.js";

const LOCAL = new Set(["localhost", "127.0.0.1", "[::1]"]);

const worker = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // Local previews (wrangler dev) stay on http.
    if (url.protocol === "http:" && !LOCAL.has(url.hostname)) {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }
    return site.fetch(request, env, ctx);
  },
};

export default worker;
