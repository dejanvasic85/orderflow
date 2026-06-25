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

test.describe("Authorization — unauthenticated access redirects to /login", () => {
  // No login: each test runs in a fresh, unauthenticated browser context. The
  // _protected guard redirects to /login?redirect=<original path>.
  test("redirected to /login from a protected admin route", async ({ page }) => {
    await page.goto("/manage/dashboard");

    await page.waitForURL("**/login**");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });

  test("redirected to /login from a protected account route", async ({ page }) => {
    await page.goto("/accounts");

    await page.waitForURL("**/login**");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });
});
