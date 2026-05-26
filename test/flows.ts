import { type Page } from "@playwright/test";

type UserPreset = "admin" | "sarah" | "tom" | "marcus" | "priya" | "olivia";

type LoginOptions = { user: UserPreset; redirectUrl?: string };

export async function login(page: Page, { user, redirectUrl = "**/dashboard" }: LoginOptions) {
  const credentials = { email: `${user}@bwow.com.au`, password: "password123" };

  await page.goto("/login");
  await page.waitForSelector("html[data-hydrated]");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(redirectUrl);
}
