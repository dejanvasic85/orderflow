import { test, expect } from "@playwright/test";
import { login } from "./flows";

test.describe("Users page", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, { user: "admin" });
  });

  test("admin can view users list and open user details in drawer", async ({ page }) => {
    await page.goto("/manage/users");

    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();

    const row = page.getByRole("row", { name: /Sarah Mitchell/i });
    await expect(row).toBeVisible();
    await expect(row.getByText("sarah@bwow.com.au")).toBeVisible();
    await expect(row.getByText("Staff")).toBeVisible();

    await row.click();

    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    await expect(drawer.getByLabel("First name")).toHaveValue("Sarah");
    await expect(drawer.getByLabel("Last name")).toHaveValue("Mitchell");
    await expect(drawer.getByRole("textbox", { name: "Email" })).toHaveValue("sarah@bwow.com.au");
  });
});
