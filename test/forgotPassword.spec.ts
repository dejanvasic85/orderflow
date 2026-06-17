import { test, expect } from "@playwright/test";

const mailpitUrl = "http://localhost:54324";

type MailpitMessage = {
  ID: string;
  Subject: string;
  To: { Address: string }[];
};

async function getResetLink(toEmail: string, timeoutMs = 10000): Promise<string> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const res = await fetch(`${mailpitUrl}/api/v1/messages`);
    const { messages } = (await res.json()) as { messages: MailpitMessage[] };

    const message = messages.find(
      (m) => m.To.some((t) => t.Address === toEmail) && m.Subject === "Reset Your Password",
    );

    if (message) {
      const bodyRes = await fetch(`${mailpitUrl}/api/v1/message/${message.ID}`);
      const body = await bodyRes.json();
      const match =
        (body.Text as string).match(/https?:\/\/\S+\/auth\/v1\/verify\S+/) ??
        (body.Text as string).match(/https?:\/\/\S+\/auth\/confirm\S*/);
      if (!match) throw new Error("Could not extract reset link from email");
      return match[0].replace("127.0.0.1", "localhost");
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`No reset email found for ${toEmail} within ${timeoutMs}ms`);
}

async function deleteAllMailpitMessages() {
  await fetch(`${mailpitUrl}/api/v1/messages`, { method: "DELETE" });
}

test.describe("Forgot password", () => {
  test.beforeEach(async () => {
    await deleteAllMailpitMessages();
  });

  test("user requests reset, receives email, and sets a new password", async ({
    page,
    browser,
  }) => {
    const email = "tom@bwow.com.au";

    // Step 1 — request a password reset
    await page.goto("/forgot-password");
    await page.waitForSelector("html[data-hydrated]");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible({
      timeout: 10000,
    });

    // Step 2 — open the reset link in a fresh browser context
    const resetLink = await getResetLink(email);
    const resetContext = await browser.newContext();
    const resetPage = await resetContext.newPage();
    await resetPage.goto(resetLink);

    // Step 3 — should land on the reset password form
    await expect(resetPage.getByRole("heading", { name: "Reset password" })).toBeVisible({
      timeout: 10000,
    });

    // Step 4 — enter and confirm the new password
    await resetPage.getByLabel("New password").fill("NewPassword456!");
    await resetPage.getByLabel("Confirm new password").fill("NewPassword456!");
    await resetPage.getByRole("button", { name: "Reset password" }).click();

    await expect(resetPage.getByRole("heading", { name: "Password updated" })).toBeVisible({
      timeout: 10000,
    });

    await resetContext.close();
  });
});
