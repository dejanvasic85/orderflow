import { expect, test } from "@playwright/test";
import { goto, login } from "./flows";

test.describe("Authorization — regular user blocked from /manage/*", () => {
  test("redirected away from /manage/dashboard", async ({ page }) => {
    await login(page, { user: "priya" });

    await goto(page, "/manage/dashboard");

    await page.waitForURL("**/accounts**");
    await expect(page).toHaveURL(/\/accounts/);
    await expect(page).not.toHaveURL(/\/manage/);
  });

  test("redirected away from /manage/users", async ({ page }) => {
    await login(page, { user: "priya" });

    await goto(page, "/manage/users");

    await page.waitForURL("**/accounts**");
    await expect(page).toHaveURL(/\/accounts/);
    await expect(page).not.toHaveURL(/\/manage/);
  });

  test("redirected away from /manage/products", async ({ page }) => {
    await login(page, { user: "priya" });

    await goto(page, "/manage/products");

    await page.waitForURL("**/accounts**");
    await expect(page).toHaveURL(/\/accounts/);
    await expect(page).not.toHaveURL(/\/manage/);
  });

  test("redirected away from /manage/orders", async ({ page }) => {
    await login(page, { user: "priya" });

    await goto(page, "/manage/orders");

    await page.waitForURL("**/accounts**");
    await expect(page).toHaveURL(/\/accounts/);
    await expect(page).not.toHaveURL(/\/manage/);
  });

  test("redirected away from /manage/accounts", async ({ page }) => {
    await login(page, { user: "priya" });

    await goto(page, "/manage/accounts");

    await page.waitForURL("**/accounts**");
    await expect(page).toHaveURL(/\/accounts/);
    await expect(page).not.toHaveURL(/\/manage/);
  });
});
