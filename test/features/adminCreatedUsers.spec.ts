import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { goto, login } from "./flows";
import { deleteAllMailpitMessages, listMessagesTo } from "./mailpit";

test.describe("Admin-created users", () => {
  test.beforeEach(async () => {
    await deleteAllMailpitMessages();
  });

  test("admin creates a user with a password and that user signs in, with no email sent", async ({
    page,
    browser,
  }) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const newEmail = faker.internet
      .email({ firstName, lastName, provider: "bwow.com.au" })
      .toLowerCase();
    const password = "Welcome123!";

    // Step 1 — admin creates the user with a password
    await login(page, { user: "admin" });
    await goto(page, "/manage/users");
    await page.getByRole("button", { name: "+ New user with password" }).click();

    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    // Wait for the sheet slide-in animation to settle before interacting
    await page.waitForTimeout(300);
    await drawer.getByLabel("First name").fill(firstName);
    await drawer.getByLabel("Last name").fill(lastName);
    await drawer.getByRole("textbox", { name: "Email" }).fill(newEmail);
    await drawer.getByLabel("Password", { exact: true }).fill(password);
    const createButton = drawer.getByRole("button", { name: "Create user" });
    await createButton.scrollIntoViewIfNeeded();
    await createButton.click();

    // Step 2 — the password is shown once for handover
    await expect(drawer.getByRole("heading", { name: "User created" })).toBeVisible({
      timeout: 10000,
    });
    await expect(drawer.getByLabel("Password", { exact: true })).toHaveValue(password);
    await drawer.getByRole("button", { name: "Done" }).click();

    await expect(page.getByText(`${firstName} ${lastName}`)).toBeVisible();

    // Step 3 — nothing was emailed
    expect(await listMessagesTo(newEmail)).toHaveLength(0);

    // Step 4 — the new user signs in straight away in a fresh browser context
    const userContext = await browser.newContext();
    const userPage = await userContext.newPage();
    await goto(userPage, "/login");
    await userPage.getByLabel("Email").fill(newEmail);
    await userPage.getByLabel("Password").fill(password);
    await userPage.getByRole("button", { name: /sign in/i }).click();

    await userPage.waitForURL("**/accounts**");

    await userContext.close();
  });
});
