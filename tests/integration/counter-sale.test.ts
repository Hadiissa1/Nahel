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
  it("takes stock at once and records a delivered, paid sale", () => {
    const p = makeProduct({ variants: [{ price: 2000, stock: 10 }] });
    const r = recordCounterSale(sale([{ id: p.id, variant: p.variantIds[0], qty: 3 }], { payment: "whish", by: "Karim" }));
    expect(r).toEqual({ ok: true, orderId: expect.any(Number), subtotal: 6000, discount: 0, total: 6000 });
    expect(stockOf(p.variantIds[0])).toBe(7);

    const o = listOrders().find((x) => r.ok && x.id === r.orderId)!;
    expect(o).toMatchObject({ status: "delivered", source: "counter", payment: "whish", handledBy: "Karim", total: 6000 });
  });

  it.each(["cash", "card", "whish"] as const)("records a %s payment", (payment) => {
    const p = makeProduct();
    const r = recordCounterSale(sale([{ id: p.id, variant: p.variantIds[0], qty: 1 }], { payment }));
    expect(listOrders().find((o) => r.ok && o.id === r.orderId)!.payment).toBe(payment);
  });

  it("uses the sale price from the database", () => {
    const p = makeProduct({ variants: [{ price: 2000, salePrice: 1600 }] });
    const r = recordCounterSale(sale([{ id: p.id, variant: p.variantIds[0], qty: 2 }]));
    expect(r).toMatchObject({ ok: true, subtotal: 3200, total: 3200 });
  });

  it("refuses when stock is short, and changes nothing (all or nothing)", () => {
    const a = makeProduct({ variants: [{ stock: 5 }] });
    const b = makeProduct({ variants: [{ label: "1kg", stock: 1 }] });
    const r = recordCounterSale(
      sale([
        { id: a.id, variant: a.variantIds[0], qty: 2 },
        { id: b.id, variant: b.variantIds[0], qty: 2 },
      ]),
    );
    expect(r).toEqual({ ok: false, error: "unavailable", shortages: [expect.objectContaining({ label: "1kg", available: 1 })] });
    expect([stockOf(a.variantIds[0]), stockOf(b.variantIds[0])]).toEqual([5, 1]);
    expect(listOrders()).toEqual([]);
  });

  it("sells hidden products too (e.g. market-only items)", () => {
    const p = makeProduct({ visible: false });
    expect(recordCounterSale(sale([{ id: p.id, variant: p.variantIds[0], qty: 1 }])).ok).toBe(true);
  });

  it("refuses an empty sale, an unknown size, or a size without a price", () => {
    const p = makeProduct({ variants: [{ price: null }] });
    expect(recordCounterSale(sale([]))).toEqual({ ok: false, error: "empty" });
    expect(recordCounterSale(sale([{ id: p.id, variant: "nope", qty: 1 }]))).toEqual({ ok: false, error: "unavailable" });
    expect(recordCounterSale(sale([{ id: p.id, variant: p.variantIds[0], qty: 1 }]))).toEqual({ ok: false, error: "no_price" });
  });

  it("applies a percent or amount discount", () => {
    const p = makeProduct({ variants: [{ price: 2000, stock: null }] });
    const line = [{ id: p.id, variant: p.variantIds[0], qty: 2 }];
    expect(recordCounterSale(sale(line, { discount: { kind: "percent", value: 25 } }))).toMatchObject({
      ok: true, subtotal: 4000, discount: 1000, total: 3000,
    });
    expect(recordCounterSale(sale(line, { discount: { kind: "amount", value: 500 } }))).toMatchObject({
      ok: true, discount: 500, total: 3500,
    });
    expect(recordCounterSale(sale(line, { discount: { kind: "percent", value: 100 } }))).toMatchObject({ ok: true, total: 0 });
  });

  it("refuses a negative discount, over 100 %, or more than the subtotal", () => {
    const p = makeProduct({ variants: [{ price: 2000, stock: 10 }] });
    const line = [{ id: p.id, variant: p.variantIds[0], qty: 1 }];
    for (const discount of [
      { kind: "amount", value: -100 },
      { kind: "percent", value: 101 },
      { kind: "amount", value: 2001 },
    ] as const) {
      expect(recordCounterSale(sale(line, { discount }))).toEqual({ ok: false, error: "discount" });
    }
    expect(stockOf(p.variantIds[0])).toBe(10);
  });

  it("merges duplicate lines", () => {
    const p = makeProduct({ variants: [{ price: 1000, stock: 10 }] });
    const v = p.variantIds[0];
    const r = recordCounterSale(sale([{ id: p.id, variant: v, qty: 2 }, { id: p.id, variant: v, qty: 3 }]));
    expect(r).toMatchObject({ ok: true, subtotal: 5000 });
    expect(stockOf(v)).toBe(5);
  });

  it("cannot be cancelled afterwards (a delivered sale is final)", () => {
    const p = makeProduct();
    const r = recordCounterSale(sale([{ id: p.id, variant: p.variantIds[0], qty: 1 }]));
    expect(r.ok && setOrderStatus(r.orderId, "cancelled")).toEqual({ ok: false, error: "transition" });
  });
});
