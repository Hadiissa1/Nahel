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
const onlyTestProducts = async () => await db().prepare("DELETE FROM products").run();

describe("stock settings", () => {
  it(`defaults to a threshold of ${DEFAULT_THRESHOLD} and no email`, async () => {
    expect(await getStockSettings()).toEqual({ threshold: DEFAULT_THRESHOLD, email: null });
  });

  it("saves the threshold and email", async () => {
    await saveStockSettings({ threshold: 2, email: "owner@nahel.test" });
    expect(await getStockSettings()).toEqual({ threshold: 2, email: "owner@nahel.test" });
    await saveStockSettings({ threshold: 0, email: null });
    expect(await getStockSettings()).toEqual({ threshold: 0, email: null });
  });
});

describe("listLowStock", () => {
  it("lists visible tracked sizes at or below the threshold, sold out first", async () => {
    await onlyTestProducts();
    const p = await makeProduct({
      variants: [
        { label: "a", stock: 5 },
        { label: "b", stock: 0 },
        { label: "c", stock: 6 },
        { label: "d", stock: null },
      ],
    });
    await makeProduct({ visible: false, variants: [{ label: "hidden", stock: 0 }] });
    expect((await listLowStock()).map((i) => [i.label, i.stock])).toEqual([
      ["b", 0],
      ["a", 5],
    ]);
    expect((await listLowStock())[0]).toMatchObject({ productId: p.id, variantId: p.variantIds[1] });
    expect(await countLowStock()).toBe(2);
  });

  it("follows the saved threshold", async () => {
    await onlyTestProducts();
    await makeProduct({ variants: [{ stock: 3 }] });
    await saveStockSettings({ threshold: 2, email: null });
    expect(await countLowStock()).toBe(0);
    await saveStockSettings({ threshold: 3, email: null });
    expect(await countLowStock()).toBe(1);
  });
});

describe("checkLowStock", () => {
  it("sends nothing without an owner email or email setup", async () => {
    await onlyTestProducts();
    await makeProduct({ variants: [{ stock: 1 }] });
    expect(await checkLowStock()).toBe(0);
    await saveStockSettings({ threshold: 5, email: "owner@nahel.test" });
    expect(await checkLowStock()).toBe(0); // email not set up on the server
  });

  it("emails the owner once per size, not again until restocked", async () => {
    await onlyTestProducts();
    const { sent } = fakeBrevo();
    await saveStockSettings({ threshold: 5, email: "owner@nahel.test" });
    const p = await makeProduct({ name: "Sidr", variants: [{ label: "1kg", stock: 2 }] });
    const v = p.variantIds[0];

    expect(await checkLowStock()).toBe(1);
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe("owner@nahel.test");
    expect(sent[0].text).toContain("• Sidr (1kg): 2 left");
    expect(sent[0].text).toContain("https://nahel.test/admin");

    await setStock(v, 1);
    expect(await checkLowStock()).toBe(0); // already reported

    await setStock(v, 20);
    expect(await checkLowStock()).toBe(0); // back above: re-armed
    await setStock(v, 0);
    expect(await checkLowStock()).toBe(1);
    expect(sent[1].text).toContain("sold out");
  });

  it("tries again next time when the email fails", async () => {
    await onlyTestProducts();
    fakeBrevo({ ok: false });
    await saveStockSettings({ threshold: 5, email: "owner@nahel.test" });
    await makeProduct({ variants: [{ stock: 1 }] });
    expect(await checkLowStock()).toBe(0);

    const { sent } = fakeBrevo();
    expect(await checkLowStock()).toBe(1);
    expect(sent).toHaveLength(1);
  });

  it("ignores hidden products", async () => {
    await onlyTestProducts();
    const { sent } = fakeBrevo();
    await saveStockSettings({ threshold: 5, email: "owner@nahel.test" });
    const p = await makeProduct({ variants: [{ stock: 1 }] });
    await setVisible(p.id, false);
    expect(await checkLowStock()).toBe(0);
    expect(sent).toEqual([]);
  });
});
