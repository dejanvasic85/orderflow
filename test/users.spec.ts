import { test, expect } from "@playwright/test";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.waitForSelector("html[data-hydrated]");
  await page.getByLabel("Email").fill("admin@bwow.com.au");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("**/dashboard");
}

test.describe("Users page", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("admin can view users list and open user details in drawer", async ({ page }) => {
    await page.goto("/users");

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
