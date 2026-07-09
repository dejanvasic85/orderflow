import { faker } from "@faker-js/faker";
import { test, expect } from "@playwright/test";
import { goto, login } from "./flows";
import { deleteAllMailpitMessages, getMessageText, waitForMessageTo } from "./mailpit";

async function getInviteLink(toEmail: string): Promise<string> {
  const message = await waitForMessageTo(toEmail);
  const text = await getMessageText(message.ID);
  const match = text.match(/https?:\/\/\S+verify\S+/);
  if (!match) throw new Error("Could not extract invite link from email");
  // Rewrite 127.0.0.1 to localhost so the browser can connect
  return match[0].replace("127.0.0.1", "localhost");
}

test.describe("Invite management", () => {
  test.beforeEach(async () => {
    await deleteAllMailpitMessages();
  });

  test("admin invites user, user accepts and sets password", async ({ page, browser }) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const invitedEmail = faker.internet
      .email({ firstName, lastName, provider: "bwow.com.au" })
      .toLowerCase();

    // Step 1 — login as admin and send invite
    await login(page, { user: "admin" });
    await goto(page, "/manage/users");
    await page.getByRole("button", { name: "+ New user" }).click();

    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    // Wait for the sheet slide-in animation to settle before interacting
    await page.waitForTimeout(300);
    await drawer.getByLabel("First name").fill(firstName);
    await drawer.getByLabel("Last name").fill(lastName);
    await drawer.getByRole("textbox", { name: "Email" }).fill(invitedEmail);
    const sendInviteButton = drawer.getByRole("button", { name: "Send invite" });
    await sendInviteButton.scrollIntoViewIfNeeded();
    await sendInviteButton.click();

    // Wait for the success toast — reliable signal the invite API call completed
    await expect(page.getByText(`Invite sent to ${invitedEmail}`)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(`${firstName} ${lastName}`)).toBeVisible();

    // Step 2 — open invite link in a fresh browser context (no shared cookies or storage)
    const inviteLink = await getInviteLink(invitedEmail);
    const inviteContext = await browser.newContext();
    const invitePage = await inviteContext.newPage();
    await goto(invitePage, inviteLink);

    // Step 3 — should land on set-password after verifying
    await expect(invitePage.getByRole("heading", { name: "Set your password" })).toBeVisible({
      timeout: 10000,
    });

    // Step 4 — set password and confirm navigation to dashboard
    await invitePage.getByLabel("Password", { exact: true }).fill("Welcome123!");
    await invitePage.getByLabel("Confirm password").fill("Welcome123!");
    await invitePage.getByRole("button", { name: "Set password" }).click();

    await invitePage.waitForURL("**/dashboard");
    await inviteContext.close();
  });
});
