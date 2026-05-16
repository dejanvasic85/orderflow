import { test, expect } from "@playwright/test";

test.describe("Users page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("admin@bwow.com.au");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("**/dashboard");
  });

  test("admin can view users list and open user details in drawer", async ({ page }) => {
    await page.goto("/users");

    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();

    const row = page.getByRole("row", { name: /Sarah Mitchell/i });
    await expect(row).toBeVisible();
    await expect(row.getByText("sarah@bwow.com.au")).toBeVisible();
    await expect(row.getByText("Staff")).toBeVisible();

    await row.click();

    await expect(page.getByText("sarah@bwow.com.au")).toBeVisible();
    await expect(page.getByLabel("First name")).toHaveValue("Sarah");
    await expect(page.getByLabel("Last name")).toHaveValue("Mitchell");
    await expect(page.getByLabel("Email")).toHaveValue("sarah@bwow.com.au");
  });
});
