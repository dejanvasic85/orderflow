import { expect, test } from "@playwright/test";
import { goto, login } from "./flows";
import { deleteAllMailpitMessages, waitForMessageTo } from "./mailpit";

// Serial: these tests share one Mailpit inbox and each clears it in beforeEach,
// so they must not interleave — otherwise one order's notification email is asserted
// against another's expected subject.
test.describe.configure({ mode: "serial" });

// The order detail page lives at /manage/orders/<id> (a path segment that is not "new").
const orderDetailUrl = /\/manage\/orders\/(?!new)[^/]+$/;

// Submitting an order POSTs to a TanStack Start server function on the Vite dev
// server. Under CI load that dev server occasionally drops the request ("Failed to
// fetch"), which throws in the submit handler and leaves the form in place — a flake,
// not a product bug. Retry the click only while we are still on the /new form, so a
// submit that already navigated is never re-issued (avoids double-creating an order).
async function submitOrderAndAwaitDetail(page: import("@playwright/test").Page) {
  const submit = page.getByRole("button", { name: /submit order/i });
  await expect(submit).toBeEnabled();

  await expect(async () => {
    if (orderDetailUrl.test(new URL(page.url()).pathname)) return;
    await submit.click();
    await page.waitForURL(orderDetailUrl, { timeout: 10000 });
  }).toPass({ timeout: 45000 });

  await expect(page.getByRole("heading", { name: /^ORD-\d{4}$/ }).first()).toBeVisible();
}

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

    // The delivery address pre-fills from the account (Harvest Table) and is editable per order.
    await expect(page.getByLabel(/delivery address/i)).toHaveValue(
      "4 Orchard Rd, Yarra Glen VIC 3775",
    );
    const deliveryAddress = "9 One-Off Court, Healesville VIC 3777";
    await page.getByLabel(/delivery address/i).fill(deliveryAddress);

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

    // The order detail shows both the (edited) delivery address and the instructions —
    // they must appear together, not cancel each other out. The success URL holds the new
    // order's id; the detail page is the same URL without the trailing "/success".
    await page.goto(page.url().replace(/\/success$/, ""));

    await expect(page.getByText("Delivery address")).toBeVisible();
    await expect(page.getByText(deliveryAddress)).toBeVisible();
    await expect(page.getByText("Delivery instructions")).toBeVisible();
    await expect(page.getByText(deliveryInstructions)).toBeVisible();
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

  test("admin can re-order from the orders list", async ({ page }) => {
    test.setTimeout(90000);
    await login(page, { user: "admin" });
    // Navigate directly to order ORD-0001 (seeded Winery Bistro order with Rosé + Pinot Noir).
    await goto(page, "/manage/orders?q=ORD-0001");

    // The search-filtered list shows exactly this order — click its Re-order link.
    const reorderLink = page.getByRole("link", { name: /re-order/i });
    await expect(reorderLink).toBeVisible();
    await reorderLink.click();

    await page.waitForURL("**/manage/orders/new**");
    await expect(page.getByRole("heading", { name: "New order" }).first()).toBeVisible();

    // Form is pre-filled with items cloned from ORD-0001 (Rosé and Pinot Noir).
    await expect(page.getByText(/Rosé/i)).toBeVisible();
    await expect(page.getByText(/Pinot Noir/i)).toBeVisible();

    // After submit, lands on the created order's detail page (not the /new form).
    await submitOrderAndAwaitDetail(page);
  });

  test("admin can re-order from the order detail page", async ({ page }) => {
    test.setTimeout(90000);
    await login(page, { user: "admin" });
    // Navigate directly to a seeded order detail page.
    await goto(page, "/manage/orders/e5f6a7b8-0001-4c9d-8e1f-000000000001");

    await expect(page.getByRole("heading", { name: /^ORD-\d{4}$/ }).first()).toBeVisible();

    const reorderButton = page.getByRole("button", { name: /re-order/i });
    await expect(reorderButton).toBeVisible();
    await reorderButton.click();

    await page.waitForURL("**/manage/orders/new**");
    await expect(page.getByRole("heading", { name: "New order" }).first()).toBeVisible();

    // Form should be pre-filled — Rosé and Pinot Noir were in order 1.
    await expect(page.getByText(/Rosé/i)).toBeVisible();
    await expect(page.getByText(/Pinot Noir/i)).toBeVisible();

    await submitOrderAndAwaitDetail(page);
  });

  test("account user can re-order from the order history list", async ({ page }) => {
    await login(page, { user: "priya" });

    // Place a distinctive order: remove Sparkling Water so its absence can verify cloning.
    await page.getByRole("button", { name: /new order/i }).click();
    await page.waitForURL("**/orders/new");
    await page.getByRole("button", { name: /Remove Sparkling Water/i }).click();
    await expect(page.getByText(/Sparkling Water/i)).not.toBeVisible();
    await page.getByRole("button", { name: /submit order/i }).click();
    await page.waitForURL("**/success");

    // Navigate back and find the Re-order link for the order just placed.
    await page.getByRole("link", { name: /back to orders/i }).click();
    await page.waitForURL("**/accounts/**");

    // The most-recent order is shown first; get the first Re-order link (the one just created).
    const reorderLink = page.getByRole("link", { name: /re-order/i }).first();
    await expect(reorderLink).toBeVisible();
    await reorderLink.click();

    // Re-order form loads with items cloned from that order (no Sparkling Water).
    await page.waitForURL("**/orders/new**");
    await expect(page.getByRole("heading", { name: "New order" }).first()).toBeVisible();
    await expect(page.getByText(/Rosé/i)).toBeVisible();
    await expect(page.getByText(/Sparkling Water/i)).not.toBeVisible();
    await expect(page.getByRole("button", { name: /submit order/i })).not.toBeDisabled();
  });
});
