import { expect, test } from "@playwright/test";
import { goto, login } from "./flows";

test.describe("Product browsing (users)", () => {
  test("navigating to accounts from selection page", async ({ page }) => {
    await login(page, { user: "olivia" });

    await expect(page.getByText("Browse").first()).toBeVisible();

    await page.getByText("Browse").first().click();
    await page.getByLabel("Search products").fill("rum");
    await expect(page.getByText("Dark Rum — Caribbean Aged")).toBeVisible();
  });
});

test.describe("Product management (admin)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, { user: "admin" });
  });

  test("admin can browse and search products", async ({ page }) => {
    await goto(page, "/manage/products");

    await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();
    await expect(page.getByText("Rosé — Provence")).toBeVisible();

    await page.getByLabel("Search products").fill("gin");

    await expect(page.getByText("Gin — Australian Botanical")).toBeVisible();
    await expect(page.getByText("Rosé — Provence")).not.toBeVisible();
  });

  test("admin can edit a product in the sheet", async ({ page }) => {
    await goto(page, "/manage/products");

    await page.getByRole("button", { name: "Edit Rosé — Provence" }).click();

    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByLabel("Name")).toHaveValue("Rosé — Provence");

    await sheet.getByLabel("Quantity per box").fill("6");
    await sheet.getByRole("button", { name: "Save changes" }).click();

    await expect(sheet).not.toBeVisible();
    await expect(page.getByText("Changes saved")).toBeVisible();
  });
});

test.describe("Product management (staff)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, { user: "sarah" });
  });

  test("staff sees a read-only catalog", async ({ page }) => {
    await goto(page, "/manage/products");

    await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();
    await expect(page.getByText("Rosé — Provence")).toBeVisible();
    await expect(page.getByRole("button", { name: "+ New product" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /^Edit / })).toHaveCount(0);
  });
});
