import { describe, expect, it } from "vitest";
import {
  bestDiscount,
  discountPercent,
  formatPrice,
  isOutOfStock,
  photoUrl,
  pickText,
  type Variant,
} from "@/lib/catalog-types";

const v = (price: number | null, wasPrice: number | null, stock: number | null = 10): Variant => ({
  id: "v",
  label: "500g",
  price,
  wasPrice,
  stock,
});

describe("formatPrice", () => {
  it("shows whole dollars without cents", () => {
    expect(formatPrice(2500)).toBe("$25");
    expect(formatPrice(0)).toBe("$0");
  });

  it("shows two decimals when there are cents", () => {
    expect(formatPrice(2550)).toBe("$25.50");
    expect(formatPrice(1)).toBe("$0.01");
  });
});

describe("discountPercent", () => {
  it("computes the percent off during a sale", () => {
    expect(discountPercent(v(800, 1000))).toBe(20);
  });

  it("rounds to a whole percent", () => {
    expect(discountPercent(v(2000, 3000))).toBe(33);
  });

  it("is 0 when there is no sale, no price, or the old price is not higher", () => {
    expect(discountPercent(v(1000, null))).toBe(0);
    expect(discountPercent(v(null, 1000))).toBe(0);
    expect(discountPercent(v(1000, 1000))).toBe(0);
    expect(discountPercent(v(1200, 1000))).toBe(0);
  });
});

describe("isOutOfStock", () => {
  it("is true at zero or below", () => {
    expect(isOutOfStock(v(1000, null, 0))).toBe(true);
    expect(isOutOfStock(v(1000, null, -1))).toBe(true);
  });

  it("is false with stock or when stock is not tracked", () => {
    expect(isOutOfStock(v(1000, null, 1))).toBe(false);
    expect(isOutOfStock(v(1000, null, null))).toBe(false);
  });
});

describe("bestDiscount", () => {
  it("takes the biggest sale among sizes", () => {
    expect(bestDiscount([v(900, 1000), v(750, 1000), v(1000, null)])).toBe(25);
  });

  it("ignores sold-out sizes", () => {
    expect(bestDiscount([v(900, 1000), v(500, 1000, 0)])).toBe(10);
  });

  it("is 0 with no sale or no sizes", () => {
    expect(bestDiscount([v(1000, null)])).toBe(0);
    expect(bestDiscount([])).toBe(0);
  });
});

describe("pickText", () => {
  it("returns the requested language", () => {
    expect(pickText({ en: "Honey", ar: "عسل" }, "ar")).toBe("عسل");
  });

  it("falls back to the other language when empty", () => {
    expect(pickText({ en: "Honey", ar: "" }, "ar")).toBe("Honey");
    expect(pickText({ en: "", ar: "عسل" }, "en")).toBe("عسل");
  });
});

describe("photoUrl", () => {
  it("points to the small or large webp", () => {
    expect(photoUrl("abc", "sm")).toBe("/media/abc-800.webp");
    expect(photoUrl("abc", "lg")).toBe("/media/abc-1600.webp");
  });
});
