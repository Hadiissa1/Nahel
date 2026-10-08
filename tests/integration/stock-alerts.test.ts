import { describe, expect, it } from "vitest";
import { setStock, setVisible } from "@/lib/products";
import {
  countReadyAlerts,
  deleteAlert,
  listReadyAlerts,
  listWaiting,
  MAX_ALERTS_PER_CONTACT,
  requestAlert,
  sendRestockEmails,
} from "@/lib/stock-alerts";
import { makeProduct } from "../setup/fixtures";
import { fakeBrevo } from "../setup/mail";

const soldOut = () => makeProduct({ name: "Thyme", variants: [{ label: "250g", stock: 0 }] });
const ask = (p: ReturnType<typeof makeProduct>, contact: { email?: string; whatsapp?: string }, lang: "ar" | "en" = "en") =>
  requestAlert({
    productId: p.id,
    variantId: p.variantIds[0],
    email: contact.email ?? null,
    whatsapp: contact.whatsapp ?? null,
    lang,
  });

describe("requestAlert", () => {
  it("records a request for a sold-out size", () => {
    const p = soldOut();
    expect(ask(p, { email: "a@x.test", whatsapp: "96170111222" })).toBe("ok");
    expect(listWaiting()).toEqual([expect.objectContaining({ productId: p.id, label: "250g", emails: 1, whatsapps: 1 })]);
  });

  it("says the size is in stock when it is (or stock is not tracked)", () => {
    expect(ask(makeProduct({ variants: [{ stock: 3 }] }), { email: "a@x.test" })).toBe("in_stock");
    expect(ask(makeProduct({ variants: [{ stock: null }] }), { email: "a@x.test" })).toBe("in_stock");
  });

  it("refuses unknown or hidden products, and a size of another product", () => {
    const p = soldOut();
    const other = soldOut();
    expect(requestAlert({ productId: p.id, variantId: "nope", email: "a@x.test", whatsapp: null, lang: "en" })).toBe("unavailable");
    expect(requestAlert({ productId: p.id, variantId: other.variantIds[0], email: "a@x.test", whatsapp: null, lang: "en" })).toBe(
      "unavailable",
    );
    setVisible(p.id, false);
    expect(ask(p, { email: "a@x.test" })).toBe("unavailable");
  });

  it("answers the same for a repeated request, and keeps one", () => {
    const p = soldOut();
    expect(ask(p, { email: "a@x.test" })).toBe("ok");
    expect(ask(p, { email: "a@x.test" })).toBe("ok");
    expect(listWaiting()[0].emails).toBe(1);
  });

  it(`limits one contact to ${MAX_ALERTS_PER_CONTACT} pending requests`, () => {
    for (let i = 0; i < MAX_ALERTS_PER_CONTACT; i++) expect(ask(soldOut(), { email: "spam@x.test" })).toBe("ok");
    expect(ask(soldOut(), { email: "spam@x.test" })).toBe("too_many");
    expect(ask(soldOut(), { email: "other@x.test" })).toBe("ok");
  });
});

describe("back in stock", () => {
  it("lists WhatsApp requests with a ready message once restocked", () => {
    process.env.SITE_URL = "https://nahel.test";
    const p = soldOut();
    ask(p, { whatsapp: "96170111222" }, "ar");
    expect(listReadyAlerts()).toEqual([]);

    setStock(p.variantIds[0], 5);
    const [alert] = listReadyAlerts();
    expect(alert).toMatchObject({ channel: "whatsapp", contact: "96170111222", lang: "ar", productName: "عسل Thyme (250g)" });
    const text = decodeURIComponent(new URL(alert.whatsappUrl!).searchParams.get("text")!);
    expect(text).toContain("متوفر من جديد");
    expect(text).toContain(`https://nahel.test/product/${p.id}`);
    expect(countReadyAlerts()).toBe(1);
    expect(listWaiting()).toEqual([]);
  });

  it("lists email requests for the owner while email is not set up", () => {
    const p = soldOut();
    ask(p, { email: "a@x.test" });
    setStock(p.variantIds[0], 5);
    expect(listReadyAlerts()).toEqual([expect.objectContaining({ channel: "email", contact: "a@x.test", whatsappUrl: null })]);
  });

  it("sends nothing while email is not set up", async () => {
    const p = soldOut();
    ask(p, { email: "a@x.test" });
    setStock(p.variantIds[0], 5);
    expect(await sendRestockEmails()).toBe(0);
  });

  it("emails each customer once in their language, then forgets the request", async () => {
    const { sent } = fakeBrevo();
    const p = soldOut();
    ask(p, { email: "en@x.test" }, "en");
    ask(p, { email: "ar@x.test" }, "ar");
    expect(await sendRestockEmails()).toBe(0); // still sold out

    setStock(p.variantIds[0], 5);
    expect(await sendRestockEmails()).toBe(2);
    const byTo = Object.fromEntries(sent.map((m) => [m.to, m]));
    expect(byTo["en@x.test"].subject).toBe("Back in stock: Thyme (250g)");
    expect(byTo["ar@x.test"].subject).toBe("عاد إلى المخزون: عسل Thyme (250g)");
    expect(byTo["en@x.test"].html).toContain(`https://nahel.test/product/${p.id}`);

    expect(await sendRestockEmails()).toBe(0);
    expect(listReadyAlerts()).toEqual([]); // email is set up: nothing left for the owner
  });

  it("keeps the request when the email fails, and sends it next time", async () => {
    fakeBrevo({ ok: false });
    const p = soldOut();
    ask(p, { email: "a@x.test" });
    setStock(p.variantIds[0], 5);
    expect(await sendRestockEmails()).toBe(0);

    const { sent } = fakeBrevo();
    expect(await sendRestockEmails()).toBe(1);
    expect(sent).toHaveLength(1);
  });

  it("lets the owner delete a handled request", () => {
    const p = soldOut();
    ask(p, { whatsapp: "96170111222" });
    setStock(p.variantIds[0], 5);
    const [alert] = listReadyAlerts();
    expect(deleteAlert(alert.id)).toBe(true);
    expect(deleteAlert(alert.id)).toBe(false);
    expect(listReadyAlerts()).toEqual([]);
  });
});
