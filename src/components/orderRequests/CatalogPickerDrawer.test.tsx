import { render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import type { ProductRow } from "@/lib/products/schema";
import { CatalogPickerDrawer } from "./CatalogPickerDrawer";

function makeProduct(overrides: Partial<ProductRow> = {}): ProductRow {
  return {
    id: "prod-1",
    name: "Sparkling Water",
    image_url: null,
    qty_per_box: 24,
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

const noItemIds = new Set<string>();

const onAdd = vi.fn();
const onRemove = vi.fn();
const onOpenChange = vi.fn();

let user: UserEvent;

beforeEach(() => {
  user = userEvent.setup();
});

function renderDrawer({
  open,
  itemProductIds = noItemIds,
}: {
  open: boolean;
  itemProductIds?: Set<string>;
}) {
  return render(
    <CatalogPickerDrawer
      open={open}
      onOpenChange={onOpenChange}
      products={products}
      itemProductIds={itemProductIds}
      onAdd={onAdd}
      onRemove={onRemove}
    />,
  );
}

test("does not render content when open is false", () => {
  renderDrawer({ open: false });

  expect(screen.queryByText("Add item")).not.toBeInTheDocument();
});

test("renders product list when open is true", () => {
  renderDrawer({ open: true });

  expect(screen.getByText("Add item")).toBeInTheDocument();
  expect(screen.getByText("Sparkling Water")).toBeInTheDocument();
});

test("shows 'Add' button for products not in the order", () => {
  renderDrawer({ open: true });

  const addButtons = screen.getAllByRole("button", { name: "Add" });
  expect(addButtons).toHaveLength(3);
});

test("shows 'Remove' button for products already in the order", () => {
  renderDrawer({ open: true, itemProductIds: new Set(["prod-2"]) });

  expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
});

test("shows 'Add' for products not in the order and 'Remove' for products that are", () => {
  renderDrawer({ open: true, itemProductIds: new Set(["prod-1"]) });

  expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  const addButtons = screen.getAllByRole("button", { name: "Add" });
  expect(addButtons).toHaveLength(2);
});

test("clicking 'Add' calls onAdd with correct productId", async () => {
  renderDrawer({ open: true });

  const addButtons = screen.getAllByRole("button", { name: "Add" });
  await user.click(addButtons[0]);

  expect(onAdd).toHaveBeenCalledWith("prod-1");
});

test("clicking 'Remove' calls onRemove with correct productId", async () => {
  renderDrawer({ open: true, itemProductIds: new Set(["prod-2"]) });

  await user.click(screen.getByRole("button", { name: "Remove" }));

  expect(onRemove).toHaveBeenCalledWith("prod-2");
});

test("clicking 'Add' does not call onOpenChange (drawer stays open)", async () => {
  renderDrawer({ open: true });

  const addButtons = screen.getAllByRole("button", { name: "Add" });
  await user.click(addButtons[0]);

  expect(onOpenChange).not.toHaveBeenCalled();
});

test("search filters products by name (case-insensitive)", async () => {
  renderDrawer({ open: true });

  await user.type(screen.getByRole("textbox", { name: "Search products" }), "water");

  expect(screen.getByText("Sparkling Water")).toBeInTheDocument();
  expect(screen.getByText("Still Water")).toBeInTheDocument();
  expect(screen.queryByText("Orange Juice")).not.toBeInTheDocument();
});

test("shows empty state when search matches nothing", async () => {
  renderDrawer({ open: true });

  await user.type(screen.getByRole("textbox", { name: "Search products" }), "xyz123");

  expect(screen.getByText("No products found")).toBeInTheDocument();
});
