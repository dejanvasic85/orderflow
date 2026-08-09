import { render, screen } from "@testing-library/react";
import { makeProduct } from "@/test/fixtures/productFixtures";
import { ProductCard } from "./ProductCard";

const product = makeProduct({ id: "prod-1", name: "Sparkling Water", qtyPerBox: 24 });

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

test("renders the full long product name including the trailing variant and size", () => {
  const longName = makeProduct({
    id: "prod-2",
    name: "Gremillet Champagne Brut Rosé 750ml",
  });

  render(<ProductCard product={longName} />);

  expect(screen.getByText("Gremillet Champagne Brut Rosé 750ml")).toBeInTheDocument();
});

test("exposes the full product name as a title attribute", () => {
  const longName = makeProduct({
    id: "prod-3",
    name: "Gremillet Champagne Blanc de Noirs 750ml",
  });

  render(<ProductCard product={longName} />);

  expect(screen.getByTitle("Gremillet Champagne Blanc de Noirs 750ml")).toBeInTheDocument();
});

test("renders without action prop without errors", () => {
  render(<ProductCard product={product} />);

  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
