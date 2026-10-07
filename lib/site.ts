/**
 * Public address of the site from SITE_URL (e.g. https://nahel.com), or null.
 * Used for absolute links (emails, share previews, sitemap). Never derived
 * from the request's Host header, which a client can forge. Set it at build
 * time too: share previews of prerendered pages are built then.
 */
export function siteUrl(): string | null {
  const url = process.env.SITE_URL?.trim().replace(/\/+$/, "");
  return url && /^https?:\/\/[^\s/]+$/.test(url) ? url : null;
}
