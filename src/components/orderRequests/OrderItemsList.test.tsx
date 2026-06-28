import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { OrderRequestItemInput } from "@/lib/orderRequests/schema";
import type { ProductRow } from "@/lib/products/schema";
import { OrderItemsList } from "./OrderItemsList";

const chardonnay: ProductRow = {
  id: "prod-1",
  name: "Chardonnay",
  description: null,
  image_url: null,
  qty_per_box: 6,
  active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const merlot: ProductRow = {
  id: "prod-2",
  name: "Merlot",
  description: null,
  image_url: null,
  qty_per_box: 12,
  active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const products = [chardonnay, merlot];

const items: OrderRequestItemInput[] = [
  { product_id: "prod-1", boxes: 2, extra_units: 0 },
  { product_id: "prod-2", boxes: 1, extra_units: 3 },
];

const onUpdate = vi.fn();
const onRemove = vi.fn();

let user: ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  user = userEvent.setup();
});

test("renders nothing when items list is empty", () => {
  const { container } = render(
    <OrderItemsList items={[]} products={products} onUpdate={onUpdate} onRemove={onRemove} />,
  );

  expect(container).toBeEmptyDOMElement();
});

test("renders each item's product name", () => {
  render(
    <OrderItemsList items={items} products={products} onUpdate={onUpdate} onRemove={onRemove} />,
  );

  expect(screen.getByText("Chardonnay")).toBeInTheDocument();
  expect(screen.getByText("Merlot")).toBeInTheDocument();
});

test("calls onUpdate with the correct productId and patch", async () => {
  render(
    <OrderItemsList items={items} products={products} onUpdate={onUpdate} onRemove={onRemove} />,
  );

  await user.click(screen.getAllByRole("button", { name: "Increase boxes" })[0]);

  expect(onUpdate).toHaveBeenCalledWith("prod-1", { boxes: 3 });
});

test("calls onRemove with the correct productId", async () => {
  render(
    <OrderItemsList items={items} products={products} onUpdate={onUpdate} onRemove={onRemove} />,
  );

  await user.click(screen.getByRole("button", { name: /Remove Chardonnay/i }));

  expect(onRemove).toHaveBeenCalledWith("prod-1");
});
