import { expect, test } from "@playwright/test";
import { orderFromShop, productCard, useEnglish } from "./helpers";

test.beforeEach(async ({ page }) => useEnglish(page));

test("a customer orders from the shop and gets a WhatsApp message ready", async ({ page }) => {
  const { orderId, cart } = await orderFromShop(page, "Lebanese Oak Honey", 2);
  expect(orderId).toBeGreaterThan(0);

  // The message is prepared, not sent: only the link is checked.
  const href = (await cart.getByRole("link", { name: "Send on WhatsApp" }).getAttribute("href"))!;
  expect(href).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
  const text = new URL(href).searchParams.get("text")!;
  expect(text).toContain(`Order no. #${orderId}`);
  expect(text).toContain("Lebanese Oak Honey");
  expect(text).toContain("×2");
  expect(text).toContain("Name: Rana Test");

  // The cart is emptied once the order is recorded.
  await cart.getByRole("button", { name: "Continue shopping" }).click();
  await page.getByRole("button", { name: "Your Cart" }).click();
  await expect(cart.getByText("Your cart is empty.")).toBeVisible();
});

test("checkout asks for a valid phone number", async ({ page }) => {
  await page.goto("/");
  await productCard(page, "Lemon Blossom Honey").getByRole("button", { name: "Add to cart" }).click();
  const cart = page.getByRole("dialog", { name: "Your Cart" });
  await cart.getByRole("button", { name: "Continue to order" }).click();
  await cart.getByLabel("Full name").fill("Rana Test");
  await cart.getByLabel("Phone / WhatsApp").fill("12");
  await cart.getByLabel("Delivery area").selectOption({ index: 1 });
  await cart.getByRole("button", { name: "Place order" }).click();
  await expect(cart.getByRole("alert")).toContainText("valid phone number");
});
