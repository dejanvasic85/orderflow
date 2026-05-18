import { faker } from "@faker-js/faker";
import { test, expect, type Page } from "@playwright/test";

const mailpitUrl = "http://localhost:54324";

async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.waitForSelector("html[data-hydrated]");
  await page.getByLabel("Email").fill("admin@bwow.com.au");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("**/dashboard");
}

async function getInviteLink(toEmail: string, timeoutMs = 10000): Promise<string> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const res = await fetch(`${mailpitUrl}/api/v1/messages`);
    const { messages } = await res.json();

    const message = messages.find(
      (m: { To: { Address: string }[]; Subject: string }) =>
        m.To.some((t) => t.Address === toEmail) && m.Subject === "You have been invited",
    );

    if (message) {
      const bodyRes = await fetch(`${mailpitUrl}/api/v1/message/${message.ID}`);
      const body = await bodyRes.json();
      const match = (body.Text as string).match(/https?:\/\/\S+verify\S+/);
      if (!match) throw new Error("Could not extract invite link from email");
      // Rewrite 127.0.0.1 to localhost so the browser can connect
      return match[0].replace("127.0.0.1", "localhost");
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`No invite email found for ${toEmail} within ${timeoutMs}ms`);
}

async function deleteAllMailpitMessages() {
  await fetch(`${mailpitUrl}/api/v1/messages`, { method: "DELETE" });
}

test.describe("Accept invite", () => {
  test.beforeEach(async () => {
    await deleteAllMailpitMessages();
  });

  test("admin invites user, user accepts and sets password", async ({ page, context }) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const invitedEmail = faker.internet
      .email({ firstName, lastName, provider: "bwow.com.au" })
      .toLowerCase();

    // Step 1 — login as admin and send invite
    await loginAsAdmin(page);
    await page.goto("/users");
    await page.waitForSelector("html[data-hydrated]");
    await page.getByRole("button", { name: "+ New user" }).click();

    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    // Wait for the sheet slide-in animation (200ms) to complete before interacting
    await page.waitForTimeout(300);
    await drawer.getByLabel("First name").fill(firstName);
    await drawer.getByLabel("Last name").fill(lastName);
    await drawer.getByRole("textbox", { name: "Email" }).fill(invitedEmail);
    await page.waitForTimeout(300);
    await drawer.getByRole("button", { name: "Send invite" }).click();

    // Step 2 — clear cookies to simulate a fresh unauthenticated session
    await context.clearCookies();

    // Step 3 — get invite link from Mailpit and open in a fresh page
    const inviteLink = await getInviteLink(invitedEmail);
    const invitePage = await context.newPage();
    await invitePage.goto(inviteLink);

    // Step 4 — should land on set-password after verifying
    await expect(invitePage.getByRole("heading", { name: "Set your password" })).toBeVisible({
      timeout: 10000,
    });

    // Step 5 — set password and confirm navigation to dashboard
    await invitePage.getByLabel("Password", { exact: true }).fill("Welcome123!");
    await invitePage.getByLabel("Confirm password").fill("Welcome123!");
    await invitePage.getByRole("button", { name: "Set password" }).click();

    await invitePage.waitForURL("**/dashboard");
  });
});
