import { describe, expect, it } from "vitest";
import { pickHoney } from "@/components/HoneyFinder";
import type { CatalogProduct } from "@/lib/catalog-types";

const honey = (id: string): CatalogProduct => ({
  id,
  category: "honey",
  name: { en: id, ar: id },
  origin: { en: "", ar: "" },
  desc: { en: "", ar: "" },
  photo: null,
  variants: [],
  rating: null,
});
const all = ["oak", "lemon", "eucalyptus", "jardi", "baraka", "sidr-egy", "sidr-kashmir", "clover", "thyme", "comb"].map(honey);

describe("pickHoney", () => {
  it("picks the honey matching the answers", () => {
    expect(pickHoney(all, ["mild", "tea", "egypt"])?.id).toBe("clover");
    expect(pickHoney(all, ["rich", "wellness", "lebanon"])?.id).toBe("oak");
    expect(pickHoney(all, ["floral", "gift", "lebanon"])?.id).toBe("jardi");
    expect(pickHoney(all, ["rich", "gift", "egypt"])?.id).toBe("sidr-egy");
  });

  it("gives the taste the most weight", () => {
    // No mild honey is from Lebanon: the taste wins over the origin.
    expect(pickHoney(all, ["mild", "gift", "lebanon"])?.id).toBe("comb");
  });

  it("always suggests something from what the shop has", () => {
    expect(pickHoney([honey("new-honey")], ["mild", "tea", "egypt"])?.id).toBe("new-honey");
    expect(pickHoney(all.filter((p) => p.id !== "clover"), ["mild", "tea", "egypt"])).toBeDefined();
    expect(pickHoney([], ["mild", "tea", "any"])).toBeUndefined();
  });
});
