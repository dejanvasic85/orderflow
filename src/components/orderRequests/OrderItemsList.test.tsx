import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { OrderRequestItemInput } from "@/lib/orderRequests/schema";
import type { Product } from "@/lib/products/schema";
import { OrderItemsList } from "./OrderItemsList";

const chardonnay: Product = {
  id: "prod-1",
  name: "Chardonnay",
  imageUrl: null,
  qtyPerBox: 6,
  active: true,
  externalId: null,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

const merlot: Product = {
  id: "prod-2",
  name: "Merlot",
  imageUrl: null,
  qtyPerBox: 12,
  active: true,
  externalId: null,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

const products = [chardonnay, merlot];

const items: OrderRequestItemInput[] = [
  { productId: "prod-1", boxes: 2, extraUnits: 0 },
  { productId: "prod-2", boxes: 1, extraUnits: 3 },
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
