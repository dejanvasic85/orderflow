import { expect, test } from "@playwright/test";
import { login } from "./flows";

test.describe("Account selection", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, { user: "tom" });
  });

  test.skip("navigating to accounts from selection page", async ({ page }) => {
    await page.goto("/accounts");
    await expect(page.getByRole("button", { name: "The Winery Bistro" })).toBeVisible();
    await page.getByRole("button", { name: "The Winery Bistro" }).click();
    await expect(page.getByText("Browse").first()).toBeVisible();
    await page.getByText("Browse").first().click();
    await page.getByLabel("Search products").fill("craft");
    await expect(page.getByText("Lager — Craft Pilsner")).toBeVisible();
  });
});
