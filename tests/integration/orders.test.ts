import { describe, expect, it } from "vitest";
import { MAX_CART_QTY } from "@/lib/catalog-types";
import { CONTACT } from "@/lib/config";
import { setVisible, setStock } from "@/lib/products";
import { listPromoCodes } from "@/lib/promo";
import {
  countNewOrders,
  deleteOrder,
  listOrders,
  MAX_ORDER_LINES,
  placeOrder,
  setOrderStatus,
  type OrderRequest,
} from "@/lib/orders";
import { clearZones, makeProduct, makePromo, makeZone, stockOf } from "../setup/fixtures";

function order(lines: OrderRequest["lines"], extra: Partial<OrderRequest> = {}): OrderRequest {
  return { lines, name: "Rana", phone: "96170123456", address: "Hamra", note: "", lang: "en", ...extra };
}

/** Places an order that must succeed; returns its id. */
function placed(req: OrderRequest) {
  const r = placeOrder(req);
  if (!r.ok) throw new Error(`order refused: ${JSON.stringify(r)}`);
  return r;
}

const orderById = (id: number) => listOrders().find((o) => o.id === id)!;
const message = (whatsappUrl: string) => decodeURIComponent(new URL(whatsappUrl).searchParams.get("text")!);

describe("placeOrder: checks against the database", () => {
  it("refuses an empty cart", () => {
    expect(placeOrder(order([]))).toEqual({ ok: false, error: "empty" });
  });

  it("requires an active delivery zone while zones are set up", () => {
    const p = makeProduct();
    const line = [{ id: p.id, variant: p.variantIds[0], qty: 1 }];
    expect(placeOrder(order(line))).toEqual({ ok: false, error: "zone" });
    expect(placeOrder(order(line, { zone: "made-up" }))).toEqual({ ok: false, error: "zone" });
    const off = makeZone({ active: false });
    expect(placeOrder(order(line, { zone: off.id }))).toEqual({ ok: false, error: "zone" });
  });

  it("does not need a zone when none are set up", () => {
    clearZones();
    const p = makeProduct();
    expect(placeOrder(order([{ id: p.id, variant: p.variantIds[0], qty: 1 }])).ok).toBe(true);
  });

  it("refuses an unknown product, an unknown size, or a size of another product", () => {
    const zone = makeZone().id;
    const a = makeProduct();
    const b = makeProduct();
    for (const line of [
      { id: "nope", variant: a.variantIds[0], qty: 1 },
      { id: a.id, variant: "nope", qty: 1 },
      { id: a.id, variant: b.variantIds[0], qty: 1 },
    ]) {
      expect(placeOrder(order([line], { zone }))).toEqual({ ok: false, error: "unavailable" });
    }
  });

  it("refuses a hidden product", () => {
    const zone = makeZone().id;
    const p = makeProduct();
    setVisible(p.id, false);
    expect(placeOrder(order([{ id: p.id, variant: p.variantIds[0], qty: 1 }], { zone }))).toEqual({
      ok: false,
      error: "unavailable",
    });
  });

  it("reports every size that lacks stock, and records nothing", () => {
    const zone = makeZone().id;
    const a = makeProduct({ variants: [{ label: "250g", stock: 2 }] });
    const b = makeProduct({ variants: [{ label: "1kg", stock: 0 }] });
    const r = placeOrder(
      order(
        [
          { id: a.id, variant: a.variantIds[0], qty: 3 },
          { id: b.id, variant: b.variantIds[0], qty: 1 },
        ],
        { zone },
      ),
    );
    expect(r).toEqual({
      ok: false,
      error: "unavailable",
      shortages: [
        { name: { en: a.name, ar: `عسل ${a.name}` }, label: "250g", available: 2 },
        { name: { en: b.name, ar: `عسل ${b.name}` }, label: "1kg", available: 0 },
      ],
    });
    expect(listOrders()).toEqual([]);
  });

  it("accepts any quantity when stock is not tracked", () => {
    const zone = makeZone().id;
    const p = makeProduct({ variants: [{ stock: null }] });
    expect(placeOrder(order([{ id: p.id, variant: p.variantIds[0], qty: 50 }], { zone })).ok).toBe(true);
  });
});

describe("placeOrder: prices and totals", () => {
  it("takes names and prices from the database (sale price included)", () => {
    const zone = makeZone({ fee: 0 }).id;
    const p = makeProduct({ variants: [{ label: "500g", price: 2000, salePrice: 1500 }] });
    // Lines carry ids and quantities only: nothing the browser sends can set a price.
    const { orderId } = placed(order([{ id: p.id, variant: p.variantIds[0], qty: 2 }], { zone }));
    const o = orderById(orderId);
    expect(o.items).toEqual([
      expect.objectContaining({ name: { en: p.name, ar: `عسل ${p.name}` }, label: "500g", unitPrice: 1500, qty: 2 }),
    ]);
    expect(o.subtotal).toBe(3000);
    expect(o.total).toBe(3000);
    expect(o.status).toBe("new");
  });

  it("merges duplicate lines and caps quantities", () => {
    const zone = makeZone().id;
    const p = makeProduct({ variants: [{ stock: null }] });
    const v = p.variantIds[0];
    const a = placed(order([{ id: p.id, variant: v, qty: 2 }, { id: p.id, variant: v, qty: 3 }], { zone }));
    expect(orderById(a.orderId).items).toEqual([expect.objectContaining({ qty: 5 })]);

    const b = placed(order([{ id: p.id, variant: v, qty: 80 }, { id: p.id, variant: v, qty: 80 }], { zone }));
    expect(orderById(b.orderId).items[0].qty).toBe(MAX_CART_QTY);
  });

  it(`keeps at most ${MAX_ORDER_LINES} lines`, () => {
    const zone = makeZone().id;
    const p = makeProduct({ variants: Array.from({ length: MAX_ORDER_LINES + 5 }, (_, i) => ({ label: `s${i}` })) });
    const lines = p.variantIds.map((variant) => ({ id: p.id, variant, qty: 1 }));
    const { orderId } = placed(order(lines, { zone }));
    expect(orderById(orderId).items).toHaveLength(MAX_ORDER_LINES);
  });

  it("adds the delivery fee, free from the zone threshold (after discount)", () => {
    const zone = makeZone({ fee: 400, freeFrom: 5000 }).id;
    const p = makeProduct({ variants: [{ price: 2000, stock: null }] });
    const line = (qty: number) => [{ id: p.id, variant: p.variantIds[0], qty }];

    const small = orderById(placed(order(line(2), { zone })).orderId);
    expect([small.subtotal, small.deliveryFee, small.total]).toEqual([4000, 400, 4400]);

    const big = orderById(placed(order(line(3), { zone })).orderId);
    expect([big.subtotal, big.deliveryFee, big.total]).toEqual([6000, 0, 6000]);

    makePromo({ code: "HALF", kind: "percent", value: 50 });
    const discounted = orderById(placed(order(line(3), { zone, promo: "HALF" })).orderId);
    expect([discounted.subtotal, discounted.discount, discounted.deliveryFee, discounted.total]).toEqual([
      6000, 3000, 400, 3400,
    ]);
  });

  it("leaves a fee to be confirmed out of the total", () => {
    const zone = makeZone({ fee: null }).id;
    const p = makeProduct({ variants: [{ price: 2000 }] });
    const o = orderById(placed(order([{ id: p.id, variant: p.variantIds[0], qty: 1 }], { zone })).orderId);
    expect([o.deliveryFee, o.total]).toEqual([null, 2000]);
  });

  it("has no total when a price is on request", () => {
    const zone = makeZone().id;
    const a = makeProduct({ variants: [{ price: 2000 }] });
    const b = makeProduct({ variants: [{ price: null }] });
    const o = orderById(
      placed(
        order(
          [
            { id: a.id, variant: a.variantIds[0], qty: 1 },
            { id: b.id, variant: b.variantIds[0], qty: 1 },
          ],
          { zone },
        ),
      ).orderId,
    );
    expect([o.subtotal, o.total]).toEqual([null, null]);
  });

  it("builds the WhatsApp message from server-side data", () => {
    const zone = makeZone({ fee: 300 });
    const p = makeProduct({ name: "Sidr", variants: [{ label: "1kg", price: 4550 }] });
    const r = placed(order([{ id: p.id, variant: p.variantIds[0], qty: 2 }], { zone: zone.id, note: "Ring twice" }));
    expect(r.whatsappUrl.startsWith(`https://wa.me/${CONTACT.whatsapp}?text=`)).toBe(true);
    const text = message(r.whatsappUrl);
    expect(text).toContain(`Hello Nahel! Order no. #${r.orderId}`);
    expect(text).toContain("• Sidr (1kg) ×2 — $91");
    expect(text).toContain(`Delivery (${zone.name.en}): $3`);
    expect(text).toContain("Total: $94");
    expect(text).toContain("Phone: +96170123456");
    expect(text).toContain("Note: Ring twice");
  });

  it("writes the message in Arabic for Arabic customers", () => {
    const zone = makeZone().id;
    const p = makeProduct();
    const text = message(placed(order([{ id: p.id, variant: p.variantIds[0], qty: 1 }], { zone, lang: "ar" })).whatsappUrl);
    expect(text).toContain("مرحباً نحّال! طلب رقم");
    expect(text).toContain(`عسل ${p.name}`);
  });
});

describe("placeOrder: promo codes (checked again, whatever the cart showed)", () => {
  const setup = () => {
    const zone = makeZone({ fee: 0 }).id;
    const p = makeProduct({ variants: [{ price: 2000, stock: null }] });
    return { zone, line: (qty: number) => [{ id: p.id, variant: p.variantIds[0], qty }] };
  };

  it("applies a valid code", () => {
    const { zone, line } = setup();
    makePromo({ code: "SAVE5", kind: "amount", value: 500 });
    const o = orderById(placed(order(line(2), { zone, promo: "SAVE5" })).orderId);
    expect([o.promoCode, o.discount, o.total]).toEqual(["SAVE5", 500, 3500]);
  });

  it("refuses an unknown, expired or used-up code", () => {
    const { zone, line } = setup();
    makePromo({ code: "OLD", expiresOn: "2000-01-01" });
    makePromo({ code: "GONE", maxUses: 0 });
    expect(placeOrder(order(line(1), { zone, promo: "NOPE" }))).toEqual({ ok: false, error: "promo", promoError: "not_found" });
    expect(placeOrder(order(line(1), { zone, promo: "OLD" }))).toEqual({ ok: false, error: "promo", promoError: "expired" });
    expect(placeOrder(order(line(1), { zone, promo: "GONE" }))).toEqual({ ok: false, error: "promo", promoError: "used_up" });
  });

  it("refuses a code under its minimum total", () => {
    const { zone, line } = setup();
    makePromo({ code: "MIN50", minTotal: 5000 });
    expect(placeOrder(order(line(2), { zone, promo: "MIN50" }))).toEqual({
      ok: false,
      error: "promo",
      promoError: "min_total",
      minTotal: 5000,
    });
    expect(placeOrder(order(line(3), { zone, promo: "MIN50" })).ok).toBe(true);
  });

  it("refuses a code when a price is on request", () => {
    const zone = makeZone().id;
    const p = makeProduct({ variants: [{ price: null }] });
    makePromo({ code: "ANY" });
    expect(placeOrder(order([{ id: p.id, variant: p.variantIds[0], qty: 1 }], { zone, promo: "ANY" }))).toEqual({
      ok: false,
      error: "promo",
      promoError: "needs_prices",
    });
  });
});

describe("setOrderStatus: stock", () => {
  const setup = (stock: number | null = 10) => {
    const zone = makeZone().id;
    const p = makeProduct({ variants: [{ stock }] });
    const v = p.variantIds[0];
    const place = (qty: number) => placed(order([{ id: p.id, variant: v, qty }], { zone })).orderId;
    return { v, place };
  };

  it("does not touch stock when the order is placed", () => {
    const { v, place } = setup(10);
    place(3);
    expect(stockOf(v)).toBe(10);
    expect(countNewOrders()).toBe(1);
  });

  it("takes stock on confirmation, once only", () => {
    const { v, place } = setup(10);
    const id = place(3);
    expect(setOrderStatus(id, "confirmed")).toEqual({ ok: true, stockChanged: true });
    expect(stockOf(v)).toBe(7);
    expect(setOrderStatus(id, "delivered")).toEqual({ ok: true, stockChanged: false });
    expect(stockOf(v)).toBe(7);
  });

  it("gives stock back when a confirmed order is cancelled", () => {
    const { v, place } = setup(10);
    const id = place(3);
    setOrderStatus(id, "confirmed");
    expect(setOrderStatus(id, "cancelled")).toEqual({ ok: true, stockChanged: true });
    expect(stockOf(v)).toBe(10);
  });

  it("does not give stock back for an order that was never confirmed", () => {
    const { v, place } = setup(10);
    const id = place(3);
    expect(setOrderStatus(id, "cancelled")).toEqual({ ok: true, stockChanged: false });
    expect(stockOf(v)).toBe(10);
  });

  it("takes stock again when a cancelled order is reopened and confirmed", () => {
    const { v, place } = setup(10);
    const id = place(3);
    setOrderStatus(id, "confirmed");
    setOrderStatus(id, "cancelled");
    setOrderStatus(id, "new");
    setOrderStatus(id, "confirmed");
    expect(stockOf(v)).toBe(7);
  });

  it("refuses to confirm when stock ran out since the order, and changes nothing", () => {
    const { v, place } = setup(5);
    const first = place(4);
    const second = place(4); // fine when placed: 4 <= 5
    expect(setOrderStatus(first, "confirmed").ok).toBe(true);
    expect(stockOf(v)).toBe(1);
    expect(setOrderStatus(second, "confirmed")).toEqual({
      ok: false,
      error: "shortage",
      shortages: [expect.objectContaining({ label: "500g", available: 1 })],
    });
    expect(stockOf(v)).toBe(1);
    expect(orderById(second).status).toBe("new");
  });

  it("is all or nothing across sizes", () => {
    const zone = makeZone().id;
    const p = makeProduct({ variants: [{ label: "a", stock: 10 }, { label: "b", stock: 1 }] });
    const [a, b] = p.variantIds;
    const id = placed(order([{ id: p.id, variant: a, qty: 2 }, { id: p.id, variant: b, qty: 1 }], { zone })).orderId;
    setStock(b, 0);
    expect(setOrderStatus(id, "confirmed").ok).toBe(false);
    expect([stockOf(a), stockOf(b)]).toEqual([10, 0]);
  });

  it("never makes stock negative", () => {
    const { v, place } = setup(2);
    const ids = [place(2), place(2), place(2)];
    for (const id of ids) setOrderStatus(id, "confirmed");
    expect(stockOf(v)).toBe(0);
  });

  it("leaves untracked stock alone", () => {
    const { v, place } = setup(null);
    expect(setOrderStatus(place(5), "confirmed")).toEqual({ ok: true, stockChanged: false });
    expect(stockOf(v)).toBeNull();
  });

  it("can still cancel after the size stopped tracking stock", () => {
    const zone = makeZone().id;
    const p = makeProduct({ variants: [{ stock: 5 }] });
    const id = placed(order([{ id: p.id, variant: p.variantIds[0], qty: 1 }], { zone })).orderId;
    setOrderStatus(id, "confirmed");
    setStock(p.variantIds[0], null);
    expect(setOrderStatus(id, "cancelled").ok).toBe(true);
  });
});

describe("setOrderStatus: rules", () => {
  const newOrder = () => {
    const zone = makeZone().id;
    const p = makeProduct();
    return placed(order([{ id: p.id, variant: p.variantIds[0], qty: 1 }], { zone })).orderId;
  };

  it("only allows the normal flow", () => {
    const id = newOrder();
    expect(setOrderStatus(id, "delivered")).toEqual({ ok: false, error: "transition" });
    expect(setOrderStatus(id, "new")).toEqual({ ok: false, error: "transition" });
    setOrderStatus(id, "confirmed");
    setOrderStatus(id, "delivered");
    expect(setOrderStatus(id, "cancelled")).toEqual({ ok: false, error: "transition" });
  });

  it("reports an unknown order", () => {
    expect(setOrderStatus(999, "confirmed")).toEqual({ ok: false, error: "not_found" });
  });

  it("records who handled the order", () => {
    const id = newOrder();
    setOrderStatus(id, "confirmed", "Karim");
    expect(orderById(id).handledBy).toBe("Karim");
  });

  it("counts a promo use on confirmation and gives it back on cancellation", () => {
    const zone = makeZone().id;
    const p = makeProduct();
    makePromo({ code: "ONCE", maxUses: 1 });
    const id = placed(order([{ id: p.id, variant: p.variantIds[0], qty: 1 }], { zone, promo: "ONCE" })).orderId;
    const uses = () => listPromoCodes().find((c) => c.code === "ONCE")!.uses;

    expect(uses()).toBe(0); // unconfirmed fake orders can't use up a code
    setOrderStatus(id, "confirmed");
    expect(uses()).toBe(1);
    setOrderStatus(id, "cancelled");
    expect(uses()).toBe(0);
  });

  it("deletes cancelled orders only", () => {
    const id = newOrder();
    expect(deleteOrder(id)).toBe(false);
    setOrderStatus(id, "cancelled");
    expect(deleteOrder(id)).toBe(true);
    expect(orderById(id)).toBeUndefined();
  });
});
