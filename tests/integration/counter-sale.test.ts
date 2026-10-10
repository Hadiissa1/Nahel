import { describe, expect, it } from "vitest";
import { listOrders, recordCounterSale, setOrderStatus } from "@/lib/orders";
import { makeProduct, stockOf } from "../setup/fixtures";

type Input = Parameters<typeof recordCounterSale>[0];
const sale = (lines: Input["lines"], extra: Partial<Input> = {}): Input => ({
  lines,
  discount: null,
  payment: "cash",
  customer: "",
  by: null,
  ...extra,
});

describe("recordCounterSale", () => {
  it("takes stock at once and records a delivered, paid sale", async () => {
    const p = await makeProduct({ variants: [{ price: 2000, stock: 10 }] });
    const r = await recordCounterSale(sale([{ id: p.id, variant: p.variantIds[0], qty: 3 }], { payment: "whish", by: "Karim" }));
    expect(r).toEqual({ ok: true, orderId: expect.any(Number), subtotal: 6000, discount: 0, total: 6000 });
    expect(await stockOf(p.variantIds[0])).toBe(7);

    const o = (await listOrders()).find((x) => r.ok && x.id === r.orderId)!;
    expect(o).toMatchObject({ status: "delivered", source: "counter", payment: "whish", handledBy: "Karim", total: 6000 });
  });

  it.each(["cash", "card", "whish"] as const)("records a %s payment", async (payment) => {
    const p = await makeProduct();
    const r = await recordCounterSale(sale([{ id: p.id, variant: p.variantIds[0], qty: 1 }], { payment }));
    expect((await listOrders()).find((o) => r.ok && o.id === r.orderId)!.payment).toBe(payment);
  });

  it("uses the sale price from the database", async () => {
    const p = await makeProduct({ variants: [{ price: 2000, salePrice: 1600 }] });
    const r = await recordCounterSale(sale([{ id: p.id, variant: p.variantIds[0], qty: 2 }]));
    expect(r).toMatchObject({ ok: true, subtotal: 3200, total: 3200 });
  });

  it("refuses when stock is short, and changes nothing (all or nothing)", async () => {
    const a = await makeProduct({ variants: [{ stock: 5 }] });
    const b = await makeProduct({ variants: [{ label: "1kg", stock: 1 }] });
    const r = await recordCounterSale(
      sale([
        { id: a.id, variant: a.variantIds[0], qty: 2 },
        { id: b.id, variant: b.variantIds[0], qty: 2 },
      ]),
    );
    expect(r).toEqual({ ok: false, error: "unavailable", shortages: [expect.objectContaining({ label: "1kg", available: 1 })] });
    expect([await stockOf(a.variantIds[0]), await stockOf(b.variantIds[0])]).toEqual([5, 1]);
    expect(await listOrders()).toEqual([]);
  });

  it("sells hidden products too (e.g. market-only items)", async () => {
    const p = await makeProduct({ visible: false });
    expect((await recordCounterSale(sale([{ id: p.id, variant: p.variantIds[0], qty: 1 }]))).ok).toBe(true);
  });

  it("refuses an empty sale, an unknown size, or a size without a price", async () => {
    const p = await makeProduct({ variants: [{ price: null }] });
    expect(await recordCounterSale(sale([]))).toEqual({ ok: false, error: "empty" });
    expect(await recordCounterSale(sale([{ id: p.id, variant: "nope", qty: 1 }]))).toEqual({ ok: false, error: "unavailable" });
    expect(await recordCounterSale(sale([{ id: p.id, variant: p.variantIds[0], qty: 1 }]))).toEqual({ ok: false, error: "no_price" });
  });

  it("applies a percent or amount discount", async () => {
    const p = await makeProduct({ variants: [{ price: 2000, stock: null }] });
    const line = [{ id: p.id, variant: p.variantIds[0], qty: 2 }];
    expect(await recordCounterSale(sale(line, { discount: { kind: "percent", value: 25 } }))).toMatchObject({
      ok: true, subtotal: 4000, discount: 1000, total: 3000,
    });
    expect(await recordCounterSale(sale(line, { discount: { kind: "amount", value: 500 } }))).toMatchObject({
      ok: true, discount: 500, total: 3500,
    });
    expect(await recordCounterSale(sale(line, { discount: { kind: "percent", value: 100 } }))).toMatchObject({ ok: true, total: 0 });
  });

  it("refuses a negative discount, over 100 %, or more than the subtotal", async () => {
    const p = await makeProduct({ variants: [{ price: 2000, stock: 10 }] });
    const line = [{ id: p.id, variant: p.variantIds[0], qty: 1 }];
    for (const discount of [
      { kind: "amount", value: -100 },
      { kind: "percent", value: 101 },
      { kind: "amount", value: 2001 },
    ] as const) {
      expect(await recordCounterSale(sale(line, { discount }))).toEqual({ ok: false, error: "discount" });
    }
    expect(await stockOf(p.variantIds[0])).toBe(10);
  });

  it("merges duplicate lines", async () => {
    const p = await makeProduct({ variants: [{ price: 1000, stock: 10 }] });
    const v = p.variantIds[0];
    const r = await recordCounterSale(sale([{ id: p.id, variant: v, qty: 2 }, { id: p.id, variant: v, qty: 3 }]));
    expect(r).toMatchObject({ ok: true, subtotal: 5000 });
    expect(await stockOf(v)).toBe(5);
  });

  it("cannot be cancelled afterwards (a delivered sale is final)", async () => {
    const p = await makeProduct();
    const r = await recordCounterSale(sale([{ id: p.id, variant: p.variantIds[0], qty: 1 }]));
    expect(r.ok && await setOrderStatus(r.orderId, "cancelled")).toEqual({ ok: false, error: "transition" });
  });
});
