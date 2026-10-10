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

const review = async (productId: string, rating: number, name = "Maya") =>
  await submitReview({ productId, rating, name, text: "Very good honey, thank you!", lang: "en" });

const idOf = async (name: string) => (await listAdminReviews()).find((r) => r.name === name)!.id;

describe("reviews", () => {
  it("waits for the owner's approval before it appears", async () => {
    const p = await makeProduct();
    expect(await review(p.id, 5)).toBe("ok");
    expect(await countPendingReviews()).toBe(1);
    expect(await getApprovedReviews(p.id)).toEqual([]);
    expect((await ratingSummaries()).get(p.id)).toBeUndefined();

    expect(await setReviewApproved(await idOf("Maya"), true)).toBe(true);
    expect(await countPendingReviews()).toBe(0);
    expect(await getApprovedReviews(p.id)).toEqual([
      expect.objectContaining({ rating: 5, name: "Maya", text: "Very good honey, thank you!", lang: "en" }),
    ]);
  });

  it("refuses reviews for unknown or hidden products", async () => {
    const p = await makeProduct();
    await setVisible(p.id, false);
    expect(await review(p.id, 4)).toBe("unavailable");
    expect(await review("nope", 4)).toBe("unavailable");
  });

  it("averages approved reviews only, to one decimal", async () => {
    const p = await makeProduct();
    await review(p.id, 5, "A");
    await review(p.id, 4, "B");
    await review(p.id, 4, "C");
    await review(p.id, 1, "Pending");
    for (const n of ["A", "B", "C"]) await setReviewApproved(await idOf(n), true);

    expect((await ratingSummaries()).get(p.id)).toEqual({ avg: 4.3, count: 3 });
    expect((await getAdminProduct(p.id))!.rating).toEqual({ avg: 4.3, count: 3 });
    expect((await getProduct(p.id))!.rating).toEqual({ avg: 4.3, count: 3 });
  });

  it("lists pending reviews first for the owner, with the product name", async () => {
    const p = await makeProduct({ name: "Oak" });
    await review(p.id, 5, "Approved");
    await setReviewApproved(await idOf("Approved"), true);
    await review(p.id, 3, "Pending");
    expect((await listAdminReviews()).map((r) => [r.name, r.approved, r.productName.en])).toEqual([
      ["Pending", false, "Oak"],
      ["Approved", true, "Oak"],
    ]);
  });

  it("can be hidden again or deleted", async () => {
    const p = await makeProduct();
    await review(p.id, 5);
    const id = await idOf("Maya");
    await setReviewApproved(id, true);
    await setReviewApproved(id, false);
    expect(await getApprovedReviews(p.id)).toEqual([]);
    expect(await deleteReview(id)).toBe(true);
    expect(await deleteReview(id)).toBe(false);
    expect(await setReviewApproved(id, true)).toBe(false);
  });
});
