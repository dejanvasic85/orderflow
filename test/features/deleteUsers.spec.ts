import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { goto, login } from "./flows";

test.describe("Deleting users", () => {
  test("admin deletes a user and the user can no longer sign in", async ({ page, browser }) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const newEmail = faker.internet
      .email({ firstName, lastName, provider: "bwow.com.au" })
      .toLowerCase();
    const password = "Welcome123!";

    await login(page, { user: "admin" });
    await goto(page, "/manage/users");
    await page.getByRole("button", { name: "+ New user with password" }).click();

    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    await page.waitForTimeout(300);
    await drawer.getByLabel("First name").fill(firstName);
    await drawer.getByLabel("Last name").fill(lastName);
    await drawer.getByRole("textbox", { name: "Email" }).fill(newEmail);
    await drawer.getByLabel("Password", { exact: true }).fill(password);
    const createButton = drawer.getByRole("button", { name: "Create user" });
    await createButton.scrollIntoViewIfNeeded();
    await createButton.click();

    await expect(drawer.getByRole("heading", { name: "User created" })).toBeVisible({
      timeout: 10000,
    });
    await drawer.getByRole("button", { name: "Done" }).click();

    // Delete the user we just made, never a seeded one.
    await page.getByLabel("Search users").fill(newEmail);
    const row = page.getByRole("row", { name: new RegExp(newEmail, "i") });
    await row.getByRole("button", { name: "User actions" }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();

    await expect(drawer).toBeVisible();
    const deleteButton = drawer.getByRole("button", { name: "Delete user" });
    await deleteButton.scrollIntoViewIfNeeded();
    await deleteButton.click();

    const confirm = page.getByRole("alertdialog");
    await expect(confirm.getByText(/Inviting the same email address later/)).toBeVisible();
    await confirm.getByRole("button", { name: "Delete user" }).click();

    await expect(page.getByText(`${firstName} ${lastName} deleted`)).toBeVisible();
    await expect(page.getByRole("row", { name: new RegExp(newEmail, "i") })).toHaveCount(0);

    // The ban is the part that actually matters: they must not get back in.
    const context = await browser.newContext();
    const userPage = await context.newPage();
    await goto(userPage, "/login");
    await userPage.getByLabel("Email").fill(newEmail);
    await userPage.getByLabel("Password").fill(password);
    await userPage.getByRole("button", { name: /sign in/i }).click();

    await expect(userPage.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await context.close();
  });

  test("admin cannot delete their own account", async ({ page }) => {
    await login(page, { user: "admin" });
    await goto(page, "/manage/users");

    const row = page.getByRole("row", { name: /admin@bwow.com.au/i });
    await row.getByRole("button", { name: "User actions" }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();

    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole("button", { name: "Delete user" })).toHaveCount(0);
  });
});
