import { render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import type { ProductRow } from "@/lib/products/schema";
import { ProductCatalog } from "./ProductCatalog";

function makeProduct(overrides: Partial<ProductRow> = {}): ProductRow {
  return {
    id: "prod-1",
    name: "Sparkling Water",
    description: null,
    image_url: null,
    qty_per_box: 12,
    active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

const products: ProductRow[] = [
  makeProduct({ id: "prod-1", name: "Sparkling Water" }),
  makeProduct({ id: "prod-2", name: "Still Water" }),
  makeProduct({ id: "prod-3", name: "Orange Juice" }),
];

let user: UserEvent;

beforeEach(() => {
  user = userEvent.setup();
});

test("renders all products when no search query", () => {
  render(<ProductCatalog products={products} />);

  expect(screen.getByText("Sparkling Water")).toBeInTheDocument();
  expect(screen.getByText("Still Water")).toBeInTheDocument();
  expect(screen.getByText("Orange Juice")).toBeInTheDocument();
});

test("renders product count label", () => {
  render(<ProductCatalog products={products} />);

  expect(screen.getByText("3 products")).toBeInTheDocument();
});

test("filters products by name (case-insensitive)", async () => {
  render(<ProductCatalog products={products} />);

  await user.type(screen.getByRole("textbox", { name: "Search products" }), "water");

  expect(screen.getByText("Sparkling Water")).toBeInTheDocument();
  expect(screen.getByText("Still Water")).toBeInTheDocument();
  expect(screen.queryByText("Orange Juice")).not.toBeInTheDocument();
  expect(screen.getByText("2 products")).toBeInTheDocument();
});

test("shows no-results empty state when search matches nothing", async () => {
  render(<ProductCatalog products={products} />);

  await user.type(screen.getByRole("textbox", { name: "Search products" }), "xyz");

  expect(screen.getByText("No products found")).toBeInTheDocument();
});

test("shows no-products empty state when products array is empty", () => {
  render(<ProductCatalog products={[]} />);

  expect(screen.getByText("No products available")).toBeInTheDocument();
});
