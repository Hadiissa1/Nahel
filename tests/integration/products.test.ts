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

const inputOf = async (id: string): Promise<ProductInput> => {
  const p = (await getAdminProduct(id))!;
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
  it("saves the product with its sizes in order", async () => {
    const { product } = await makeProduct({
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

  it("shows a sale price with the regular price crossed out", async () => {
    const { product } = await makeProduct({ variants: [{ price: 2000, salePrice: 1500 }] });
    expect(product.variants[0]).toMatchObject({ price: 1500, wasPrice: 2000 });
  });

  it("ignores a sale price that is not lower than the price", async () => {
    const { product } = await makeProduct({ variants: [{ price: 2000, salePrice: 2500 }] });
    expect(product.variants[0]).toMatchObject({ price: 2000, wasPrice: null });
  });
});

describe("public catalog", () => {
  it("lists visible products only", async () => {
    const shown = await makeProduct();
    const hidden = await makeProduct({ visible: false });
    const ids = (await getCatalog()).map((p) => p.id);
    expect(ids).toContain(shown.id);
    expect(ids).not.toContain(hidden.id);
    expect(await getProduct(hidden.id)).toBeUndefined();
  });

  it("leaves out products without any size", async () => {
    const empty = await makeProduct({ variants: [] });
    expect((await getCatalog()).map((p) => p.id)).not.toContain(empty.id);
  });

  it("admin list includes hidden products", async () => {
    const hidden = await makeProduct({ visible: false });
    expect((await listAdminProducts()).find((p) => p.id === hidden.id)?.visible).toBe(false);
  });
});

describe("updateProduct", () => {
  it("updates sizes in place, adds new ones and removes missing ones", async () => {
    const { id, variantIds } = await makeProduct({
      variants: [{ label: "250g" }, { label: "500g" }],
    });
    const input = await inputOf(id);
    input.variants = [
      { ...input.variants[1], price: 2600 },
      { label: "1kg", price: 5000, salePrice: null, stock: 4 },
    ];
    expect(await updateProduct(id, input, undefined)).toEqual({ found: true, oldPhoto: null });

    const after = (await getAdminProduct(id))!.variants;
    expect(after.map((v) => v.label)).toEqual(["500g", "1kg"]);
    expect(after[0].id).toBe(variantIds[1]);
    expect(after[0].price).toBe(2600);
    expect(after.map((v) => v.id)).not.toContain(variantIds[0]);
  });

  it("never reuses a size id that belongs to another product", async () => {
    const other = await makeProduct();
    const { id } = await makeProduct();
    const input = await inputOf(id);
    input.variants = [{ id: other.variantIds[0], label: "stolen", price: 1, salePrice: null, stock: 1 }];
    await updateProduct(id, input, undefined);

    expect((await getAdminProduct(other.id))!.variants[0].label).toBe("500g");
    expect((await getAdminProduct(id))!.variants[0].id).not.toBe(other.variantIds[0]);
  });

  it("returns the replaced photo so its files can be deleted", async () => {
    const { id } = await makeProduct();
    await updateProduct(id, await inputOf(id), "photo-a");
    expect(await updateProduct(id, await inputOf(id), "photo-b")).toEqual({ found: true, oldPhoto: "photo-a" });
    expect(await updateProduct(id, await inputOf(id), undefined)).toEqual({ found: true, oldPhoto: null });
    expect((await getAdminProduct(id))!.photo).toBe("photo-b");
  });

  it("reports a missing product", async () => {
    const { id } = await makeProduct();
    expect(await updateProduct("nope", await inputOf(id), undefined)).toEqual({ found: false, oldPhoto: null });
  });
});

describe("deleteProduct", () => {
  it("removes the product and its sizes", async () => {
    const { id, variantIds } = await makeProduct();
    expect(await deleteProduct(id)).toEqual({ found: true, photo: null });
    expect(await getAdminProduct(id)).toBeUndefined();
    expect(await setStock(variantIds[0], 5)).toBe(false);
    expect(await deleteProduct(id)).toEqual({ found: false, photo: null });
  });
});

describe("setVisible / setStock", () => {
  it("hides and shows a product", async () => {
    const { id } = await makeProduct();
    expect(await setVisible(id, false)).toBe(true);
    expect(await getProduct(id)).toBeUndefined();
    await setVisible(id, true);
    expect(await getProduct(id)).toBeDefined();
    expect(await setVisible("nope", true)).toBe(false);
  });

  it("sets or stops tracking the stock of a size", async () => {
    const { variantIds } = await makeProduct();
    expect(await setStock(variantIds[0], 42)).toBe(true);
    expect(await stockOf(variantIds[0])).toBe(42);
    await setStock(variantIds[0], null);
    expect(await stockOf(variantIds[0])).toBeNull();
    expect(await setStock("nope", 1)).toBe(false);
  });
});
