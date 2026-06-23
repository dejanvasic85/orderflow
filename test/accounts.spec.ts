import { test, expect } from "@playwright/test";
import { goto, login } from "./flows";

test.describe("Account selection", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, { user: "tom" });
  });

  test("navigating to accounts from selection page", async ({ page }) => {
    await goto(page, "/accounts");

    await expect(page.getByText(/select an account/i)).toBeVisible();
    await expect(page.getByText(/which account are you ordering for/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "The Winery Bistro" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cellar Door Co." })).toBeVisible();
    await expect(page.getByRole("button", { name: "Vine & Barrel" })).toBeVisible();

    await page.getByRole("button", { name: "The Winery Bistro" }).click();
    await page.waitForURL("**/accounts/**");
    await expect(page.getByRole("heading", { name: "The Winery Bistro" })).toBeVisible();
  });
});
