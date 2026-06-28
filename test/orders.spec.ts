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

  test("editing a template item's box and unit quantities updates its total", async ({ page }) => {
    await login(page, { user: "priya" });

    await expect(page.getByRole("heading", { name: "Harvest Table" })).toBeVisible();
    await page.getByRole("button", { name: /new order/i }).click();
    await page.waitForURL("**/orders/new");
    await expect(page.getByRole("heading", { name: "New order" })).toBeVisible();

    // Template items are now pre-filled and editable directly — no need to add from
    // the catalog. Scope to the Rosé card (1 box × 6 per box = 6 total on load).
    const roseCard = page
      .locator("div")
      .filter({ has: page.getByText(/Rosé/i) })
      .filter({ has: page.getByRole("button", { name: "Increase boxes" }) })
      .last();

    // The total renders as an animated, per-digit element labelled "Total N".
    await expect(roseCard.getByLabel("Total 6")).toBeVisible();

    // Increase boxes to 2 → total = 2 × 6 + 0 = 12.
    await roseCard.getByRole("button", { name: "Increase boxes" }).click();
    await expect(roseCard.getByLabel("Total 12")).toBeVisible();

    // Add 3 extra units → total = 2 × 6 + 3 = 15.
    await roseCard.getByRole("button", { name: "Increase units" }).click();
    await roseCard.getByRole("button", { name: "Increase units" }).click();
    await roseCard.getByRole("button", { name: "Increase units" }).click();
    await expect(roseCard.getByLabel("Total 15")).toBeVisible();
  });

  test("removing a template item from the order and submitting without it", async ({ page }) => {
    await login(page, { user: "priya" });

    await expect(page.getByRole("heading", { name: "Harvest Table" })).toBeVisible();
    await page.getByRole("button", { name: /new order/i }).click();
    await page.waitForURL("**/orders/new");
    await expect(page.getByRole("heading", { name: "New order" })).toBeVisible();

    // Sparkling Water is in Harvest Table's template — remove it.
    await expect(page.getByText(/Sparkling Water/i)).toBeVisible();
    await page.getByRole("button", { name: /Remove Sparkling Water/i }).click();
    await expect(page.getByText(/Sparkling Water/i)).not.toBeVisible();

    // Remaining template items still allow submission.
    await page.getByRole("button", { name: /submit order/i }).click();
    await page.waitForURL("**/success");
    await expect(page.getByRole("heading", { name: "Order submitted" })).toBeVisible();
  });
});
