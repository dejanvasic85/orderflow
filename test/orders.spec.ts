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
});
