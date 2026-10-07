/**
 * Product and hero photos, self-hosted under public/images/.
 *
 * Only add a photo here after checking that it really shows the product.
 * Free-licensed photos (e.g. Wikimedia Commons, CC BY / CC BY-SA) must keep
 * their author and licence: they are listed in the footer's photo credits.
 */
export interface Photo {
  src: string; // path under /public, e.g. "/images/products/oak.webp"
  alt: string;
  author: string;
  license: string; // e.g. "CC BY-SA 4.0"
  sourceUrl: string; // page the photo comes from
}

/** Keyed by product id (see lib/data.ts). */
export const PRODUCT_PHOTOS: Record<string, Photo> = {};

/** Photos for the shuffling grid at the top of the page. */
export const HERO_PHOTOS: Photo[] = [];

export const ALL_PHOTOS: Photo[] = [
  ...HERO_PHOTOS,
  ...Object.values(PRODUCT_PHOTOS),
];
