# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: manageInvite.spec.ts >> Invite management >> admin invites user, user accepts and sets password
- Location: test/manageInvite.spec.ts:48:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Invite sent to harvey.runolfsdottir31@bwow.com.au')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('Invite sent to harvey.runolfsdottir31@bwow.com.au')

```

```yaml
- region "Notifications alt+T"
- dialog "Invite user":
    - heading "Invite user" [level=2]
    - paragraph: Send an invite email to a new user
    - heading "Invite new user" [level=2]
    - paragraph: They'll receive an email to set their password
    - group:
        - text: First name
        - textbox "First name": Harvey
    - group:
        - text: Last name
        - textbox "Last name": Runolfsdottir
    - group:
        - text: Email
        - textbox "Email": harvey.runolfsdottir31@bwow.com.au
    - group:
        - text: Mobile number
        - textbox "Mobile number":
            - /placeholder: 04xxxxxxxx
    - group:
        - text: Role
        - combobox "Role": User
    - text: Notification preferences
    - checkbox "Email notifications" [checked]
    - text: Email notifications
    - checkbox "SMS notifications"
    - text: SMS notifications
    - button "Send invite"
    - button "Discard"
    - button "Close"
```

# Test source

```ts
  1  | import { faker } from "@faker-js/faker";
  2  | import { test, expect } from "@playwright/test";
  3  | import { login } from "./flows";
  4  |
  5  | const mailpitUrl = "http://localhost:54324";
  6  |
  7  | type MailpitMessage = {
  8  |   ID: string;
  9  |   Subject: string;
  10 |   To: { Address: string }[];
  11 | };
  12 |
  13 | async function getInviteLink(toEmail: string, timeoutMs = 10000): Promise<string> {
  14 |   const deadline = Date.now() + timeoutMs;
  15 |
  16 |   while (Date.now() < deadline) {
  17 |     const res = await fetch(`${mailpitUrl}/api/v1/messages`);
  18 |     const { messages } = (await res.json()) as { messages: MailpitMessage[] };
  19 |
  20 |     const message = messages.find(
  21 |       (m) => m.To.some((t) => t.Address === toEmail) && m.Subject === "You have been invited",
  22 |     );
  23 |
  24 |     if (message) {
  25 |       const bodyRes = await fetch(`${mailpitUrl}/api/v1/message/${message.ID}`);
  26 |       const body = await bodyRes.json();
  27 |       const match = (body.Text as string).match(/https?:\/\/\S+verify\S+/);
  28 |       if (!match) throw new Error("Could not extract invite link from email");
  29 |       // Rewrite 127.0.0.1 to localhost so the browser can connect
  30 |       return match[0].replace("127.0.0.1", "localhost");
  31 |     }
  32 |
  33 |     await new Promise((resolve) => setTimeout(resolve, 500));
  34 |   }
  35 |
  36 |   throw new Error(`No invite email found for ${toEmail} within ${timeoutMs}ms`);
  37 | }
  38 |
  39 | async function deleteAllMailpitMessages() {
  40 |   await fetch(`${mailpitUrl}/api/v1/messages`, { method: "DELETE" });
  41 | }
  42 |
  43 | test.describe("Invite management", () => {
  44 |   test.beforeEach(async () => {
  45 |     await deleteAllMailpitMessages();
  46 |   });
  47 |
  48 |   test("admin invites user, user accepts and sets password", async ({ page, browser }) => {
  49 |     const firstName = faker.person.firstName();
  50 |     const lastName = faker.person.lastName();
  51 |     const invitedEmail = faker.internet
  52 |       .email({ firstName, lastName, provider: "bwow.com.au" })
  53 |       .toLowerCase();
  54 |
  55 |     // Step 1 — login as admin and send invite
  56 |     await login(page, { user: "admin" });
  57 |     await page.goto("/manage/users");
  58 |     await page.waitForSelector("html[data-hydrated]");
  59 |     await page.getByRole("button", { name: "+ New user" }).click();
  60 |
  61 |     const drawer = page.getByRole("dialog");
  62 |     await expect(drawer).toBeVisible();
  63 |     // Wait for the sheet slide-in animation to settle before interacting
  64 |     await page.waitForTimeout(300);
  65 |     await drawer.getByLabel("First name").fill(firstName);
  66 |     await drawer.getByLabel("Last name").fill(lastName);
  67 |     await drawer.getByRole("textbox", { name: "Email" }).fill(invitedEmail);
  68 |     const sendInviteButton = drawer.getByRole("button", { name: "Send invite" });
  69 |     await sendInviteButton.scrollIntoViewIfNeeded();
  70 |     await sendInviteButton.click();
  71 |
  72 |     // Wait for the success toast — reliable signal the invite API call completed
> 73 |     await expect(page.getByText(`Invite sent to ${invitedEmail}`)).toBeVisible({ timeout: 10000 });
     |                                                                    ^ Error: expect(locator).toBeVisible() failed
  74 |     await expect(page.getByText(`${firstName} ${lastName}`)).toBeVisible();
  75 |
  76 |     // Step 2 — open invite link in a fresh browser context (no shared cookies or storage)
  77 |     const inviteLink = await getInviteLink(invitedEmail);
  78 |     const inviteContext = await browser.newContext();
  79 |     const invitePage = await inviteContext.newPage();
  80 |     await invitePage.goto(inviteLink);
  81 |
  82 |     // Step 3 — should land on set-password after verifying
  83 |     await expect(invitePage.getByRole("heading", { name: "Set your password" })).toBeVisible({
  84 |       timeout: 10000,
  85 |     });
  86 |
  87 |     // Step 4 — set password and confirm navigation to dashboard
  88 |     await invitePage.getByLabel("Password", { exact: true }).fill("Welcome123!");
  89 |     await invitePage.getByLabel("Confirm password").fill("Welcome123!");
  90 |     await invitePage.getByRole("button", { name: "Set password" }).click();
  91 |
  92 |     await invitePage.waitForURL("**/dashboard");
  93 |     await inviteContext.close();
  94 |   });
  95 | });
  96 |
```
