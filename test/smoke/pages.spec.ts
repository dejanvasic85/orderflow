import { test, expect } from "@playwright/test";
import { goto, login } from "./flows";

test("all main pages load after login", async ({ page }) => {
  await login(page);

  await goto(page, "/manage/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await goto(page, "/manage/orders");
  await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible();

  await goto(page, "/manage/accounts");
  await expect(page.getByRole("heading", { name: "Accounts" })).toBeVisible();

  await goto(page, "/manage/products");
  await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();

  await goto(page, "/manage/users");
  await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();

  await goto(page, "/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
});
