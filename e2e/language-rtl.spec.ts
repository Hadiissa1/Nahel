import { expect, test } from "@playwright/test";

test("the shop opens in Arabic, right to left", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.getByRole("heading", { name: "عسل سنديان لبناني" }).first()).toBeVisible();
});

test("switching to English goes left to right and is remembered", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Switch language" }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: "Lebanese Oak Honey" }).first()).toBeVisible();

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByRole("heading", { name: "Lebanese Oak Honey" }).first()).toBeVisible();

  await page.getByRole("button", { name: "Switch language" }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});
