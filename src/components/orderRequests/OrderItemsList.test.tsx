import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { OrderRequestItemInput } from "@/lib/orderRequests/schema";
import { makeProduct } from "@/test/fixtures/productFixtures";
import { OrderItemsList } from "./OrderItemsList";

const chardonnay = makeProduct({ id: "prod-1", name: "Chardonnay", qtyPerBox: 6 });

const merlot = makeProduct({ id: "prod-2", name: "Merlot", qtyPerBox: 12 });

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
