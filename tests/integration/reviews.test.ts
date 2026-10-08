import { describe, expect, it } from "vitest";
import { getAdminProduct, getProduct, setVisible } from "@/lib/products";
import {
  countPendingReviews,
  deleteReview,
  getApprovedReviews,
  listAdminReviews,
  ratingSummaries,
  setReviewApproved,
  submitReview,
} from "@/lib/reviews";
import { makeProduct } from "../setup/fixtures";

const review = (productId: string, rating: number, name = "Maya") =>
  submitReview({ productId, rating, name, text: "Very good honey, thank you!", lang: "en" });

const idOf = (name: string) => listAdminReviews().find((r) => r.name === name)!.id;

describe("reviews", () => {
  it("waits for the owner's approval before it appears", async () => {
    const p = makeProduct();
    expect(review(p.id, 5)).toBe("ok");
    expect(countPendingReviews()).toBe(1);
    expect(await getApprovedReviews(p.id)).toEqual([]);
    expect(ratingSummaries().get(p.id)).toBeUndefined();

    expect(setReviewApproved(idOf("Maya"), true)).toBe(true);
    expect(countPendingReviews()).toBe(0);
    expect(await getApprovedReviews(p.id)).toEqual([
      expect.objectContaining({ rating: 5, name: "Maya", text: "Very good honey, thank you!", lang: "en" }),
    ]);
  });

  it("refuses reviews for unknown or hidden products", () => {
    const p = makeProduct();
    setVisible(p.id, false);
    expect(review(p.id, 4)).toBe("unavailable");
    expect(review("nope", 4)).toBe("unavailable");
  });

  it("averages approved reviews only, to one decimal", async () => {
    const p = makeProduct();
    review(p.id, 5, "A");
    review(p.id, 4, "B");
    review(p.id, 4, "C");
    review(p.id, 1, "Pending");
    for (const n of ["A", "B", "C"]) setReviewApproved(idOf(n), true);

    expect(ratingSummaries().get(p.id)).toEqual({ avg: 4.3, count: 3 });
    expect(getAdminProduct(p.id)!.rating).toEqual({ avg: 4.3, count: 3 });
    expect((await getProduct(p.id))!.rating).toEqual({ avg: 4.3, count: 3 });
  });

  it("lists pending reviews first for the owner, with the product name", () => {
    const p = makeProduct({ name: "Oak" });
    review(p.id, 5, "Approved");
    setReviewApproved(idOf("Approved"), true);
    review(p.id, 3, "Pending");
    expect(listAdminReviews().map((r) => [r.name, r.approved, r.productName.en])).toEqual([
      ["Pending", false, "Oak"],
      ["Approved", true, "Oak"],
    ]);
  });

  it("can be hidden again or deleted", async () => {
    const p = makeProduct();
    review(p.id, 5);
    const id = idOf("Maya");
    setReviewApproved(id, true);
    setReviewApproved(id, false);
    expect(await getApprovedReviews(p.id)).toEqual([]);
    expect(deleteReview(id)).toBe(true);
    expect(deleteReview(id)).toBe(false);
    expect(setReviewApproved(id, true)).toBe(false);
  });
});
