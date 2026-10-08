import { expect, test } from "@playwright/test";
import { adminLogin, adminRow, orderFromShop, useEnglish } from "./helpers";

test.beforeEach(async ({ page }) => useEnglish(page));

test("a wrong admin password is refused", async ({ page }) => {
  await adminLogin(page, "not-the-password");
  await expect(page.getByRole("alert").filter({ hasText: "Wrong password." })).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("confirming an order takes it out of stock", async ({ page }) => {
  await adminLogin(page);
  await expect(page).toHaveURL(/\/admin$/);

  // Track stock for the 250g jar of oak honey: 5 in stock.
  const stock = () => adminRow(page, "Lebanese Oak Honey").getByLabel("Stock 250g");
  await stock().fill("5");
  await adminRow(page, "Lebanese Oak Honey").getByRole("button", { name: "Save" }).click();
  await page.reload();
  await expect(stock()).toHaveValue("5");

  // A customer orders 2 jars: stock does not move yet.
  const { orderId } = await orderFromShop(page, "Lebanese Oak Honey", 2);
  await page.goto("/admin");
  await expect(stock()).toHaveValue("5");

  // The owner confirms the order: 3 left.
  await page.goto("/admin/orders");
  const order = page.getByRole("listitem", { name: `#${orderId}` });
  await expect(order).toContainText("New");
  await order.getByRole("button", { name: "Confirm (take from stock)" }).click();
  await expect(order).toContainText("Confirmed");

  await page.goto("/admin");
  await expect(stock()).toHaveValue("3");
});
