import { render, screen } from "@testing-library/react";
import type { Product } from "@/lib/products/schema";
import { ProductCard } from "./ProductCard";

const product: Product = {
  id: "prod-1",
  name: "Sparkling Water",
  imageUrl: null,
  qtyPerBox: 24,
  active: true,
  externalId: null,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

test("renders product name", () => {
  render(<ProductCard product={product} />);

  expect(screen.getByText("Sparkling Water")).toBeInTheDocument();
});

test("renders qty per box badge", () => {
  render(<ProductCard product={product} />);

  expect(screen.getByText("24 per box")).toBeInTheDocument();
});

test("renders action slot content when provided", () => {
  render(<ProductCard product={product} action={<button>Add</button>} />);

  expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
});

test("renders without action prop without errors", () => {
  render(<ProductCard product={product} />);

  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
