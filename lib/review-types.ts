/** A published review, as shown in the shop. */
export interface Review {
  id: string;
  rating: number;
  name: string;
  text: string;
  lang: "ar" | "en";
  /** YYYY-MM-DD */
  date: string;
}

export interface RatingSummary {
  /** Average rating, one decimal. */
  avg: number;
  count: number;
}

export const REVIEW_LIMITS = { name: 60, textMin: 10, textMax: 1000 };
