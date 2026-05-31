import { render, screen } from "@testing-library/react";
import type { ProductRow } from "@/lib/products/schema";
import { ProductCard } from "./ProductCard";

const product: ProductRow = {
  id: "prod-1",
  name: "Sparkling Water",
  description: "Refreshing sparkling water",
  image_url: null,
  qty_per_box: 24,
  active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

test("renders product name", () => {
  render(<ProductCard product={product} />);

  expect(screen.getByText("Sparkling Water")).toBeInTheDocument();
});

test("renders qty per box badge", () => {
  render(<ProductCard product={product} />);

  expect(screen.getByText("24 per box")).toBeInTheDocument();
});

test("renders product description when present", () => {
  render(<ProductCard product={product} />);

  expect(screen.getByText("Refreshing sparkling water")).toBeInTheDocument();
});

test("does not render description when absent", () => {
  render(<ProductCard product={{ ...product, description: null }} />);

  expect(screen.queryByText("Refreshing sparkling water")).not.toBeInTheDocument();
});

test("renders action slot content when provided", () => {
  render(<ProductCard product={product} action={<button>Add</button>} />);

  expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
});

test("renders without action prop without errors", () => {
  render(<ProductCard product={product} />);

  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
