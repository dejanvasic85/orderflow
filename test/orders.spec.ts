import { expect, test } from "@playwright/test";
import { login } from "./flows";
import { deleteAllMailpitMessages, waitForMessageTo } from "./mailpit";

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

  test("editing a draft item's box and bottle quantities updates its total", async ({ page }) => {
    await login(page, { user: "priya" });

    await expect(page.getByRole("heading", { name: "Harvest Table" })).toBeVisible();
    await page.getByRole("button", { name: /new order/i }).click();
    await page.waitForURL("**/orders/new");
    await expect(page.getByRole("heading", { name: "New order" })).toBeVisible();

    // Template items are read-only; add a catalog item (Gin, 6 per box, not in the
    // Harvest Table template) to get the one editable quantity card. Because it's the
    // only editable item, its quantity controls and Total are unambiguous on the page.
    await page.getByRole("button", { name: /add item/i }).click();
    await page.getByLabel("Search products").fill("Gin");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.getByLabel("Search products").press("Escape");

    await expect(page.getByRole("heading", { name: "Additional items" })).toBeVisible();

    // Scope to the editable Gin card (template items also show a "Total", so the
    // assertion must be card-scoped). The card is the one containing the product name.
    const ginCard = page
      .locator("div")
      .filter({ has: page.getByText("Gin — Australian Botanical") })
      .filter({ has: page.getByRole("button", { name: "Increase boxes" }) })
      .last();
    const ginTotal = () => ginCard.getByText("Total").locator("xpath=following-sibling::*[1]");

    // New draft items start at 1 box, 0 bottles → total = 1 * 6 + 0 = 6.
    await expect(ginTotal()).toHaveText("6");

    // Increase boxes to 2 → total = 2 * 6 + 0 = 12.
    await ginCard.getByRole("button", { name: "Increase boxes" }).click();
    await expect(ginTotal()).toHaveText("12");

    // Add 3 extra bottles → total = 2 * 6 + 3 = 15.
    await ginCard.getByRole("button", { name: "Increase bottles" }).click();
    await ginCard.getByRole("button", { name: "Increase bottles" }).click();
    await ginCard.getByRole("button", { name: "Increase bottles" }).click();
    await expect(ginTotal()).toHaveText("15");
  });
});
