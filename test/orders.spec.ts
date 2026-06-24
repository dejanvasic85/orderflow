import { expect, test } from "@playwright/test";
import { goto, login } from "./flows";
import { deleteAllMailpitMessages, waitForMessageTo } from "./mailpit";

// Serial: these tests share one Mailpit inbox and each clears it in beforeEach,
// so they must not interleave — otherwise one order's notification email is asserted
// against another's expected subject.
test.describe.configure({ mode: "serial" });

test.describe("Orders", () => {
  test.beforeEach(async () => {
    await deleteAllMailpitMessages();
  });

  test("placing an order by a regular user assigned to a single account", async ({ page }) => {
    await login(page, { user: "priya" });

    await expect(page.getByRole("heading", { name: "Harvest Table" })).toBeVisible();

    await page.getByRole("button", { name: /new order/i }).click();
    await page.waitForURL("**/orders/new");

    await expect(page.getByRole("heading", { name: "New order" })).toBeVisible();

    const deliveryInstructions = "Leave at the side gate, code 4821.";
    await page.getByLabel(/delivery instructions/i).fill(deliveryInstructions);
    await expect(page.getByLabel(/delivery instructions/i)).toHaveValue(deliveryInstructions);

    await page.getByRole("button", { name: /submit order/i }).click();
    await page.waitForURL("**/success");

    await expect(page.getByRole("heading", { name: "Order submitted" })).toBeVisible();
    await expect(
      page.getByText(/your order has been received and is being processed/i),
    ).toBeVisible();

    const placerEmail = await waitForMessageTo("priya@bwow.com.au");
    expect(placerEmail.Subject).toContain("has been submitted");

    const staffEmail = await waitForMessageTo("admin@bwow.com.au");
    expect(staffEmail.Subject).toContain("New order");
    expect(staffEmail.Subject).toContain("Harvest Table");
  });

  test("admin places an order on behalf of an account via the combobox", async ({ page }) => {
    await login(page, { user: "admin" });
    // `goto` waits for hydration; the AccountCombobox popover won't open on click
    // until React has hydrated the page.
    await goto(page, "/manage/orders/new");

    await expect(page.getByRole("heading", { name: "New order" })).toBeVisible();

    // Pick the account through the AccountCombobox; The Winery Bistro has a template,
    // so the order form pre-fills its items and the order can be submitted as-is.
    await page.getByRole("combobox").click();
    await page.getByPlaceholder("Search accounts...").fill("Winery");
    await page.getByRole("option", { name: "The Winery Bistro" }).click();

    await expect(page.getByRole("button", { name: /submit order/i })).toBeVisible();
    await page.getByRole("button", { name: /submit order/i }).click();

    // Lands on the created order's admin detail page (order ref heading + account name).
    await page.waitForURL("**/manage/orders/**");
    await expect(page.getByRole("heading", { name: /^ORD-\d{4}$/ }).first()).toBeVisible();
    await expect(page.getByText("The Winery Bistro")).toBeVisible();
  });

  test("staff places an order on behalf of an account via the combobox", async ({ page }) => {
    await login(page, { user: "marcus" });
    // `goto` waits for hydration; the AccountCombobox popover won't open on click
    // until React has hydrated the page.
    await goto(page, "/manage/orders/new");

    await expect(page.getByRole("heading", { name: "New order" })).toBeVisible();

    // Cellar Door Co. has a template, so the order form pre-fills its items.
    await page.getByRole("combobox").click();
    await page.getByPlaceholder("Search accounts...").fill("Cellar");
    await page.getByRole("option", { name: "Cellar Door Co." }).click();

    await expect(page.getByRole("button", { name: /submit order/i })).toBeVisible();
    await page.getByRole("button", { name: /submit order/i }).click();

    await page.waitForURL("**/manage/orders/**");
    await expect(page.getByRole("heading", { name: /^ORD-\d{4}$/ }).first()).toBeVisible();
    await expect(page.getByText("Cellar Door Co.")).toBeVisible();
  });
});
