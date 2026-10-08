import { describe, expect, it } from "vitest";
import {
  checkLowStock,
  countLowStock,
  DEFAULT_THRESHOLD,
  getStockSettings,
  listLowStock,
  saveStockSettings,
} from "@/lib/low-stock";
import { setStock, setVisible } from "@/lib/products";
import { db } from "@/lib/db";
import { makeProduct } from "../setup/fixtures";
import { fakeBrevo } from "../setup/mail";

// The starter catalog has its own stock levels: start each test from a clean slate.
const onlyTestProducts = () => db().exec("DELETE FROM products");

describe("stock settings", () => {
  it(`defaults to a threshold of ${DEFAULT_THRESHOLD} and no email`, () => {
    expect(getStockSettings()).toEqual({ threshold: DEFAULT_THRESHOLD, email: null });
  });

  it("saves the threshold and email", () => {
    saveStockSettings({ threshold: 2, email: "owner@nahel.test" });
    expect(getStockSettings()).toEqual({ threshold: 2, email: "owner@nahel.test" });
    saveStockSettings({ threshold: 0, email: null });
    expect(getStockSettings()).toEqual({ threshold: 0, email: null });
  });
});

describe("listLowStock", () => {
  it("lists visible tracked sizes at or below the threshold, sold out first", () => {
    onlyTestProducts();
    const p = makeProduct({
      variants: [
        { label: "a", stock: 5 },
        { label: "b", stock: 0 },
        { label: "c", stock: 6 },
        { label: "d", stock: null },
      ],
    });
    makeProduct({ visible: false, variants: [{ label: "hidden", stock: 0 }] });
    expect(listLowStock().map((i) => [i.label, i.stock])).toEqual([
      ["b", 0],
      ["a", 5],
    ]);
    expect(listLowStock()[0]).toMatchObject({ productId: p.id, variantId: p.variantIds[1] });
    expect(countLowStock()).toBe(2);
  });

  it("follows the saved threshold", () => {
    onlyTestProducts();
    makeProduct({ variants: [{ stock: 3 }] });
    saveStockSettings({ threshold: 2, email: null });
    expect(countLowStock()).toBe(0);
    saveStockSettings({ threshold: 3, email: null });
    expect(countLowStock()).toBe(1);
  });
});

describe("checkLowStock", () => {
  it("sends nothing without an owner email or email setup", async () => {
    onlyTestProducts();
    makeProduct({ variants: [{ stock: 1 }] });
    expect(await checkLowStock()).toBe(0);
    saveStockSettings({ threshold: 5, email: "owner@nahel.test" });
    expect(await checkLowStock()).toBe(0); // email not set up on the server
  });

  it("emails the owner once per size, not again until restocked", async () => {
    onlyTestProducts();
    const { sent } = fakeBrevo();
    saveStockSettings({ threshold: 5, email: "owner@nahel.test" });
    const p = makeProduct({ name: "Sidr", variants: [{ label: "1kg", stock: 2 }] });
    const v = p.variantIds[0];

    expect(await checkLowStock()).toBe(1);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe("owner@nahel.test");
    expect(sent[0].text).toContain("• Sidr (1kg): 2 left");
    expect(sent[0].text).toContain("https://nahel.test/admin");

    setStock(v, 1);
    expect(await checkLowStock()).toBe(0); // already reported

    setStock(v, 20);
    expect(await checkLowStock()).toBe(0); // back above: re-armed
    setStock(v, 0);
    expect(await checkLowStock()).toBe(1);
    expect(sent[1].text).toContain("sold out");
  });

  it("tries again next time when the email fails", async () => {
    onlyTestProducts();
    fakeBrevo({ ok: false });
    saveStockSettings({ threshold: 5, email: "owner@nahel.test" });
    makeProduct({ variants: [{ stock: 1 }] });
    expect(await checkLowStock()).toBe(0);

    const { sent } = fakeBrevo();
    expect(await checkLowStock()).toBe(1);
    expect(sent).toHaveLength(1);
  });

  it("ignores hidden products", async () => {
    onlyTestProducts();
    const { sent } = fakeBrevo();
    saveStockSettings({ threshold: 5, email: "owner@nahel.test" });
    const p = makeProduct({ variants: [{ stock: 1 }] });
    setVisible(p.id, false);
    expect(await checkLowStock()).toBe(0);
    expect(sent).toEqual([]);
  });
});
