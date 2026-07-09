import { faker } from "@faker-js/faker";
import { test, expect } from "@playwright/test";
import { goto, login } from "./flows";

test.describe("Users management", () => {
  test("admin can edit user details in the drawer", async ({ page }) => {
    await login(page, { user: "admin" });
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

    const newPhone = `04${faker.string.numeric(8)}`;
    await drawer.getByLabel("Mobile number").fill(newPhone);
    await drawer.getByLabel("First name").fill("Sarah-Jane");
    await drawer.getByLabel("Last name").fill("Mitchell-Brown");
    await drawer.getByLabel("Active").click();

    await drawer.getByRole("button", { name: "Save changes" }).click();

    await expect(page.getByText("Changes saved")).toBeVisible();

    // Revert every change so the seed stays clean and the `sarah` login preset
    // keeps working for other specs. Locate by email since the name has changed.
    const editedRow = page.getByRole("row", { name: /sarah@bwow.com.au/i });
    await editedRow.getByRole("button", { name: "User actions" }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();

    await expect(drawer).toBeVisible();
    await drawer.getByLabel("First name").fill("Sarah");
    await drawer.getByLabel("Last name").fill("Mitchell");
    await drawer.getByLabel("Mobile number").fill("");
    await drawer.getByLabel("Active").click();

    await drawer.getByRole("button", { name: "Save changes" }).click();

    await expect(page.getByText("Changes saved")).toBeVisible();
  });

  test("staff can see readonly view of user", async ({ page }) => {
    await login(page, { user: "marcus" });
    await goto(page, "/manage/users");

    // Assert that the menu item
    const row = page.getByRole("row", { name: /Sarah Mitchell/i });
    await expect(row).toBeVisible();
    await expect(row.getByText("sarah@bwow.com.au")).toBeVisible();
    await expect(row.getByText("Staff")).toBeVisible();

    await row.getByRole("button", { name: "User actions" }).click();
    await page.getByRole("menuitem", { name: "View" }).click();

    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    await expect(drawer.getByLabel("First name")).not.toBeEditable();
    await expect(drawer.getByLabel("Last name")).not.toBeEditable();
    await expect(drawer.getByLabel("Mobile number")).not.toBeEditable();
  });
});
