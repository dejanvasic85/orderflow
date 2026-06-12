import { expect, test } from "@playwright/test";
import { login } from "./flows";

test.describe("Products page (admin)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, { user: "admin" });
  });

  test("admin can browse and search products", async ({ page }) => {
    await page.goto("/manage/products");

    await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();
    await expect(page.getByText("Rosé — Provence")).toBeVisible();

    await page.getByLabel("Search products").fill("gin");

    await expect(page.getByText("Gin — Australian Botanical")).toBeVisible();
    await expect(page.getByText("Rosé — Provence")).not.toBeVisible();
  });

  test("admin can edit a product in the sheet", async ({ page }) => {
    await page.goto("/manage/products");

    await page.getByRole("button", { name: "Edit Rosé — Provence" }).click();

    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByLabel("Name")).toHaveValue("Rosé — Provence");

    await sheet.getByLabel("Quantity per box").fill("6");
    await sheet.getByRole("button", { name: "Save changes" }).click();

    await expect(sheet).not.toBeVisible();
    await expect(page.getByText("Changes saved")).toBeVisible();
  });

  test("admin can create a product", async ({ page }) => {
    const name = `Test Cider — E2E ${Date.now()}`;

    await page.goto("/manage/products");
    await page.getByRole("button", { name: "+ New product" }).click();

    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();

    await sheet.getByLabel("Name").fill(name);
    await sheet.getByLabel("Quantity per box").fill("6");
    await sheet.getByRole("button", { name: "Create product" }).click();

    await expect(sheet).not.toBeVisible();
    await expect(page.getByRole("button", { name: `Edit ${name}` })).toBeVisible();
  });
});

test.describe("Products page (staff)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, { user: "sarah" });
  });

  test("staff sees a read-only catalog", async ({ page }) => {
    await page.goto("/manage/products");

    await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();
    await expect(page.getByText("Rosé — Provence")).toBeVisible();
    await expect(page.getByRole("button", { name: "+ New product" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /^Edit / })).toHaveCount(0);
  });
});
