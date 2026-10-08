import { describe, expect, it } from "vitest";
import {
  deleteProduct,
  getAdminProduct,
  getCatalog,
  getProduct,
  listAdminProducts,
  setStock,
  setVisible,
  updateProduct,
  type ProductInput,
} from "@/lib/products";
import { makeProduct, stockOf } from "../setup/fixtures";

const inputOf = (id: string): ProductInput => {
  const p = getAdminProduct(id)!;
  return {
    category: p.category,
    name: p.name,
    origin: p.origin,
    desc: p.desc,
    visible: p.visible,
    variants: p.variants.map((v) => ({
      id: v.id,
      label: v.label,
      price: v.wasPrice ?? v.price,
      salePrice: v.wasPrice !== null ? v.price : null,
      stock: v.stock,
    })),
  };
};

describe("createProduct", () => {
  it("saves the product with its sizes in order", () => {
    const { product } = makeProduct({
      variants: [
        { label: "250g", price: 1200, stock: 3 },
        { label: "1kg", price: 4000, stock: null },
      ],
    });
    expect(product.name.en).toMatch(/^Test honey/);
    expect(product.variants.map((v) => [v.label, v.price, v.stock])).toEqual([
      ["250g", 1200, 3],
      ["1kg", 4000, null],
    ]);
  });

  it("shows a sale price with the regular price crossed out", () => {
    const { product } = makeProduct({ variants: [{ price: 2000, salePrice: 1500 }] });
    expect(product.variants[0]).toMatchObject({ price: 1500, wasPrice: 2000 });
  });

  it("ignores a sale price that is not lower than the price", () => {
    const { product } = makeProduct({ variants: [{ price: 2000, salePrice: 2500 }] });
    expect(product.variants[0]).toMatchObject({ price: 2000, wasPrice: null });
  });
});

describe("public catalog", () => {
  it("lists visible products only", async () => {
    const shown = makeProduct();
    const hidden = makeProduct({ visible: false });
    const ids = (await getCatalog()).map((p) => p.id);
    expect(ids).toContain(shown.id);
    expect(ids).not.toContain(hidden.id);
    expect(await getProduct(hidden.id)).toBeUndefined();
  });

  it("leaves out products without any size", async () => {
    const empty = makeProduct({ variants: [] });
    expect((await getCatalog()).map((p) => p.id)).not.toContain(empty.id);
  });

  it("admin list includes hidden products", () => {
    const hidden = makeProduct({ visible: false });
    expect(listAdminProducts().find((p) => p.id === hidden.id)?.visible).toBe(false);
  });
});

describe("updateProduct", () => {
  it("updates sizes in place, adds new ones and removes missing ones", () => {
    const { id, variantIds } = makeProduct({
      variants: [{ label: "250g" }, { label: "500g" }],
    });
    const input = inputOf(id);
    input.variants = [
      { ...input.variants[1], price: 2600 },
      { label: "1kg", price: 5000, salePrice: null, stock: 4 },
    ];
    expect(updateProduct(id, input, undefined)).toEqual({ found: true, oldPhoto: null });

    const after = getAdminProduct(id)!.variants;
    expect(after.map((v) => v.label)).toEqual(["500g", "1kg"]);
    expect(after[0].id).toBe(variantIds[1]);
    expect(after[0].price).toBe(2600);
    expect(after.map((v) => v.id)).not.toContain(variantIds[0]);
  });

  it("never reuses a size id that belongs to another product", () => {
    const other = makeProduct();
    const { id } = makeProduct();
    const input = inputOf(id);
    input.variants = [{ id: other.variantIds[0], label: "stolen", price: 1, salePrice: null, stock: 1 }];
    updateProduct(id, input, undefined);

    expect(getAdminProduct(other.id)!.variants[0].label).toBe("500g");
    expect(getAdminProduct(id)!.variants[0].id).not.toBe(other.variantIds[0]);
  });

  it("returns the replaced photo so its files can be deleted", () => {
    const { id } = makeProduct();
    updateProduct(id, inputOf(id), "photo-a");
    expect(updateProduct(id, inputOf(id), "photo-b")).toEqual({ found: true, oldPhoto: "photo-a" });
    expect(updateProduct(id, inputOf(id), undefined)).toEqual({ found: true, oldPhoto: null });
    expect(getAdminProduct(id)!.photo).toBe("photo-b");
  });

  it("reports a missing product", () => {
    const { id } = makeProduct();
    expect(updateProduct("nope", inputOf(id), undefined)).toEqual({ found: false, oldPhoto: null });
  });
});

describe("deleteProduct", () => {
  it("removes the product and its sizes", () => {
    const { id, variantIds } = makeProduct();
    expect(deleteProduct(id)).toEqual({ found: true, photo: null });
    expect(getAdminProduct(id)).toBeUndefined();
    expect(setStock(variantIds[0], 5)).toBe(false);
    expect(deleteProduct(id)).toEqual({ found: false, photo: null });
  });
});

describe("setVisible / setStock", () => {
  it("hides and shows a product", async () => {
    const { id } = makeProduct();
    expect(setVisible(id, false)).toBe(true);
    expect(await getProduct(id)).toBeUndefined();
    setVisible(id, true);
    expect(await getProduct(id)).toBeDefined();
    expect(setVisible("nope", true)).toBe(false);
  });

  it("sets or stops tracking the stock of a size", () => {
    const { variantIds } = makeProduct();
    expect(setStock(variantIds[0], 42)).toBe(true);
    expect(stockOf(variantIds[0])).toBe(42);
    setStock(variantIds[0], null);
    expect(stockOf(variantIds[0])).toBeNull();
    expect(setStock("nope", 1)).toBe(false);
  });
});
