import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { OrderRequestItemInput } from "@/lib/orderRequests/schema";
import type { ProductRow } from "@/lib/products/schema";
import { DraftItemCard } from "./DraftItemCard";

const product: ProductRow = {
  id: "prod-1",
  name: "Chardonnay",
  description: null,
  image_url: null,
  qty_per_box: 6,
  active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const item: OrderRequestItemInput = {
  product_id: "prod-1",
  boxes: 2,
  extra_bottles: 3,
};

const onUpdate = vi.fn();
const onRemove = vi.fn();

let user: ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  user = userEvent.setup();
});

test("renders the product name", () => {
  render(<DraftItemCard item={item} product={product} onUpdate={onUpdate} onRemove={onRemove} />);

  expect(screen.getByText("Chardonnay")).toBeInTheDocument();
});

test("renders qty_per_box subtitle", () => {
  render(<DraftItemCard item={item} product={product} onUpdate={onUpdate} onRemove={onRemove} />);

  expect(screen.getByText("6 per box")).toBeInTheDocument();
});

test("renders boxes count", () => {
  render(<DraftItemCard item={item} product={product} onUpdate={onUpdate} onRemove={onRemove} />);

  expect(screen.getByText("2")).toBeInTheDocument();
});

test("renders extra_bottles count", () => {
  render(<DraftItemCard item={item} product={product} onUpdate={onUpdate} onRemove={onRemove} />);

  expect(screen.getByText("3")).toBeInTheDocument();
});

test("renders computed total (boxes × qty_per_box + extra_bottles)", () => {
  render(<DraftItemCard item={item} product={product} onUpdate={onUpdate} onRemove={onRemove} />);

  // 2 × 6 + 3 = 15
  expect(screen.getByText("15")).toBeInTheDocument();
});

test("clicking Increase boxes calls onUpdate with boxes + 1", async () => {
  render(<DraftItemCard item={item} product={product} onUpdate={onUpdate} onRemove={onRemove} />);

  await user.click(screen.getByRole("button", { name: "Increase boxes" }));

  expect(onUpdate).toHaveBeenCalledWith({ boxes: 3 });
});

test("clicking Decrease boxes calls onUpdate with boxes - 1", async () => {
  render(<DraftItemCard item={item} product={product} onUpdate={onUpdate} onRemove={onRemove} />);

  await user.click(screen.getByRole("button", { name: "Decrease boxes" }));

  expect(onUpdate).toHaveBeenCalledWith({ boxes: 1 });
});

test("clicking Decrease boxes does not go below 0", async () => {
  const zeroBoxes: OrderRequestItemInput = { ...item, boxes: 0 };
  render(
    <DraftItemCard item={zeroBoxes} product={product} onUpdate={onUpdate} onRemove={onRemove} />,
  );

  await user.click(screen.getByRole("button", { name: "Decrease boxes" }));

  expect(onUpdate).toHaveBeenCalledWith({ boxes: 0 });
});

test("clicking Increase bottles calls onUpdate with extra_bottles + 1", async () => {
  render(<DraftItemCard item={item} product={product} onUpdate={onUpdate} onRemove={onRemove} />);

  await user.click(screen.getByRole("button", { name: "Increase bottles" }));

  expect(onUpdate).toHaveBeenCalledWith({ extra_bottles: 4 });
});

test("clicking Decrease bottles calls onUpdate with extra_bottles - 1", async () => {
  render(<DraftItemCard item={item} product={product} onUpdate={onUpdate} onRemove={onRemove} />);

  await user.click(screen.getByRole("button", { name: "Decrease bottles" }));

  expect(onUpdate).toHaveBeenCalledWith({ extra_bottles: 2 });
});

test("clicking Decrease bottles does not go below 0", async () => {
  const zeroBottles: OrderRequestItemInput = { ...item, extra_bottles: 0 };
  render(
    <DraftItemCard item={zeroBottles} product={product} onUpdate={onUpdate} onRemove={onRemove} />,
  );

  await user.click(screen.getByRole("button", { name: "Decrease bottles" }));

  expect(onUpdate).toHaveBeenCalledWith({ extra_bottles: 0 });
});

test("clicking remove calls onRemove", async () => {
  render(<DraftItemCard item={item} product={product} onUpdate={onUpdate} onRemove={onRemove} />);

  await user.click(screen.getByRole("button", { name: /Remove Chardonnay/i }));

  expect(onRemove).toHaveBeenCalledOnce();
});

test("uses product_id as fallback name when product is undefined", () => {
  render(<DraftItemCard item={item} product={undefined} onUpdate={onUpdate} onRemove={onRemove} />);

  expect(screen.getByText("prod-1")).toBeInTheDocument();
});
