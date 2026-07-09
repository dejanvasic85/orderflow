import { type Page } from "@playwright/test";

type UserPreset = "admin" | "sarah" | "tom" | "marcus" | "priya" | "olivia";

const adminUsers: UserPreset[] = ["admin", "sarah", "marcus"];

type LoginOptions = { user: UserPreset };

type GotoOptions = { waitForHydration?: boolean };

export async function goto(
  page: Page,
  path: string,
  { waitForHydration = true }: GotoOptions = {},
) {
  await page.goto(path);
  if (waitForHydration) {
    await page.waitForSelector("html[data-hydrated]");
  }
}

export async function login(page: Page, { user }: LoginOptions) {
  const targetUrl = adminUsers.includes(user) ? "**/dashboard" : "**/accounts**";
  const credentials = { email: `${user}@bwow.com.au`, password: "password123" };

  await goto(page, "/login");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(targetUrl);
}
