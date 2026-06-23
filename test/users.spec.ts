import { test, expect } from "@playwright/test";
import { goto, login } from "./flows";

test.describe("Users management", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, { user: "admin" });
  });

  test("admin can edit user details in the drawer", async ({ page }) => {
    await goto(page, "/manage/users");

    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();

    const row = page.getByRole("row", { name: /Sarah Mitchell/i });
    await expect(row).toBeVisible();
    await expect(row.getByText("sarah@bwow.com.au")).toBeVisible();
    await expect(row.getByText("Staff")).toBeVisible();

    await row.getByRole("button", { name: "User actions" }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();

    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    await expect(drawer.getByLabel("First name")).toHaveValue("Sarah");
    await expect(drawer.getByLabel("Last name")).toHaveValue("Mitchell");
    await expect(drawer.getByRole("textbox", { name: "Email" })).toHaveValue("sarah@bwow.com.au");
  });
});
