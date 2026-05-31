import { render, screen } from "@testing-library/react";
import type { TemplateItem } from "@/lib/templates/schema";
import { TemplateItemCard } from "./TemplateItemCard";

const item: TemplateItem = {
  id: "item-1",
  template_id: "tmpl-1",
  product_id: "prod-1",
  box_count: 2,
  bottle_count: 3,
  created_by: null,
  created_at: "2024-01-01T00:00:00Z",
  products: { id: "prod-1", name: "Pinot Noir", qty_per_box: 12 },
};

test("renders the product name", () => {
  render(<TemplateItemCard item={item} />);

  expect(screen.getByText("Pinot Noir")).toBeInTheDocument();
});

test("renders qty_per_box subtitle", () => {
  render(<TemplateItemCard item={item} />);

  expect(screen.getByText("12 per box")).toBeInTheDocument();
});

test("renders box count", () => {
  render(<TemplateItemCard item={item} />);

  expect(screen.getByText("2")).toBeInTheDocument();
});

test("renders bottle count", () => {
  render(<TemplateItemCard item={item} />);

  expect(screen.getByText("3")).toBeInTheDocument();
});

test("renders computed total (box_count × qty_per_box + bottle_count)", () => {
  render(<TemplateItemCard item={item} />);

  // 2 × 12 + 3 = 27
  expect(screen.getByText("27")).toBeInTheDocument();
});
