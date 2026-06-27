import { render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import type { OrderRequestItemInput } from "@/lib/orderRequests/schema";
import type { ProductRow } from "@/lib/products/schema";
import { CatalogPickerDrawer } from "./CatalogPickerDrawer";

function makeProduct(overrides: Partial<ProductRow> = {}): ProductRow {
  return {
    id: "prod-1",
    name: "Sparkling Water",
    description: null,
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

const noTemplateIds = new Set<string>();
const noDraftItems: OrderRequestItemInput[] = [];

const onAdd = vi.fn();
const onRemove = vi.fn();
const onOpenChange = vi.fn();

let user: UserEvent;

beforeEach(() => {
  user = userEvent.setup();
});

function renderDrawer(
  open: boolean,
  overrides: {
    templateProductIds?: Set<string>;
    draftItems?: OrderRequestItemInput[];
  } = {},
) {
  return render(
    <CatalogPickerDrawer
      open={open}
      onOpenChange={onOpenChange}
      products={products}
      templateProductIds={overrides.templateProductIds ?? noTemplateIds}
      draftItems={overrides.draftItems ?? noDraftItems}
      onAdd={onAdd}
      onRemove={onRemove}
    />,
  );
}

test("does not render content when open is false", () => {
  renderDrawer(false);

  expect(screen.queryByText("Add item")).not.toBeInTheDocument();
});

test("renders product list when open is true", () => {
  renderDrawer(true);

  expect(screen.getByText("Add item")).toBeInTheDocument();
  expect(screen.getByText("Sparkling Water")).toBeInTheDocument();
});

test("shows 'In your template' for products in templateProductIds", () => {
  renderDrawer(true, { templateProductIds: new Set(["prod-1"]) });

  expect(screen.getByRole("button", { name: "In your template" })).toBeVisible();
});

test("shows 'Add' button for products not in template and not in draftItems", () => {
  renderDrawer(true, { templateProductIds: new Set(["prod-1"]) });

  const addButtons = screen.getAllByRole("button", { name: "Add" });
  expect(addButtons).toHaveLength(2);
});

test("shows 'Remove' button for products in draftItems", () => {
  renderDrawer(true, {
    draftItems: [{ product_id: "prod-2", boxes: 1, extra_units: 0 }],
  });

  expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
});

test("clicking 'Add' calls onAdd with correct productId", async () => {
  renderDrawer(true);

  const addButtons = screen.getAllByRole("button", { name: "Add" });
  await user.click(addButtons[0]);

  expect(onAdd).toHaveBeenCalledWith("prod-1");
});

test("clicking 'Remove' calls onRemove with correct productId", async () => {
  renderDrawer(true, {
    draftItems: [{ product_id: "prod-2", boxes: 1, extra_units: 0 }],
  });

  await user.click(screen.getByRole("button", { name: "Remove" }));

  expect(onRemove).toHaveBeenCalledWith("prod-2");
});

test("clicking 'Add' does not call onOpenChange (drawer stays open)", async () => {
  renderDrawer(true);

  const addButtons = screen.getAllByRole("button", { name: "Add" });
  await user.click(addButtons[0]);

  expect(onOpenChange).not.toHaveBeenCalled();
});

test("search filters products by name (case-insensitive)", async () => {
  renderDrawer(true);

  await user.type(screen.getByRole("textbox", { name: "Search products" }), "water");

  expect(screen.getByText("Sparkling Water")).toBeInTheDocument();
  expect(screen.getByText("Still Water")).toBeInTheDocument();
  expect(screen.queryByText("Orange Juice")).not.toBeInTheDocument();
});

test("shows empty state when search matches nothing", async () => {
  renderDrawer(true);

  await user.type(screen.getByRole("textbox", { name: "Search products" }), "xyz123");

  expect(screen.getByText("No products found")).toBeInTheDocument();
});
