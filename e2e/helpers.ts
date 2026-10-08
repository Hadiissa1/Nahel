import { expect, type Page } from "@playwright/test";
import { ADMIN_PASSWORD } from "../playwright.config";

/** Opens pages in English (the shop defaults to Arabic). */
export async function useEnglish(page: Page) {
  await page.addInitScript(() => localStorage.setItem("nahel-lang", "en"));
}

/** The card of a product in the shop. */
export function productCard(page: Page, name: string) {
  return page.locator("article").filter({ has: page.getByRole("heading", { name }) }).first();
}

/** The row of a product in the admin product list. */
export function adminRow(page: Page, name: string) {
  return page.locator("li").filter({ has: page.getByRole("heading", { name }) });
}

/** Adds a product to the cart from the shop, checks out, and returns the order number. */
export async function orderFromShop(page: Page, productName: string, qty = 1) {
  await page.goto("/");
  await productCard(page, productName).getByRole("button", { name: "Add to cart" }).click();

  const cart = page.getByRole("dialog", { name: "Your Cart" });
  await expect(cart).toBeVisible();
  for (let i = 1; i < qty; i++) await cart.getByRole("button", { name: "Increase" }).click();
  await cart.getByRole("button", { name: "Continue to order" }).click();

  await cart.getByLabel("Full name").fill("Rana Test");
  await cart.getByLabel("Phone / WhatsApp").fill("+961 70 123 456");
  await cart.getByLabel("Delivery area").selectOption({ index: 1 });
  await cart.getByRole("button", { name: "Place order" }).click();

  const done = cart.getByRole("status").filter({ hasText: /Order no\. \d+ recorded/ });
  await expect(done).toBeVisible();
  const orderId = Number((await done.textContent())!.match(/\d+/)![0]);
  return { orderId, cart };
}

export async function adminLogin(page: Page, password = ADMIN_PASSWORD) {
  await page.goto("/admin/login");
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}
