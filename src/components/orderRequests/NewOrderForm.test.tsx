import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as draftOrder from "@/lib/orderRequests/draftOrder";
import type { OrderRequestItemInput } from "@/lib/orderRequests/schema";
import type { ProductRow } from "@/lib/products/schema";
import type { TemplateWithItems } from "@/lib/templates/schema";
import { NewOrderForm } from "./NewOrderForm";

vi.mock("@/lib/orderRequests/draftOrder");
vi.mock("@/hooks/use-media-query", () => ({ useMediaQuery: () => false }));

const loadDraftMock = vi.mocked(draftOrder.loadDraft);
const saveDraftMock = vi.mocked(draftOrder.saveDraft);
const clearDraftMock = vi.mocked(draftOrder.clearDraft);

const accountId = "b2c3d4e5-f6a7-4b8c-9d0e-000000000a01";

const product1: ProductRow = {
  id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000003",
  name: "Chardonnay",
  description: null,
  image_url: null,
  qty_per_box: 6,
  active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const product2: ProductRow = {
  id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000004",
  name: "Merlot",
  description: null,
  image_url: null,
  qty_per_box: 12,
  active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const template: TemplateWithItems = {
  id: "d4e5f6a7-b8c9-4d0e-9f2a-000000000001",
  account_id: accountId,
  name: "Weekly Wine Pack",
  created_by: "a1b2c3d4-e5f6-4a7b-8c9d-000000000001",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  template_items: [
    {
      id: "item-1",
      template_id: "d4e5f6a7-b8c9-4d0e-9f2a-000000000001",
      product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000001",
      box_count: 2,
      unit_count: 0,
      created_by: null,
      created_at: "2024-01-01T00:00:00Z",
      products: { id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000001", name: "Rosé", qty_per_box: 6 },
    },
    {
      id: "item-2",
      template_id: "d4e5f6a7-b8c9-4d0e-9f2a-000000000001",
      product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000002",
      box_count: 1,
      unit_count: 3,
      created_by: null,
      created_at: "2024-01-01T00:00:00Z",
      products: { id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000002", name: "Pinot Noir", qty_per_box: 12 },
    },
  ],
};

const onSubmit = vi.fn();
const onBack = vi.fn();
let user: ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  onSubmit.mockResolvedValue(undefined);
  user = userEvent.setup();
  loadDraftMock.mockReturnValue([]);
});

function renderForm(overrides?: Partial<React.ComponentProps<typeof NewOrderForm>>) {
  const rootRoute = createRootRoute({
    component: () => (
      <NewOrderForm
        accountId={accountId}
        accountName="The Winery Bistro"
        defaultDeliveryInstructions={null}
        template={template}
        products={[product1, product2]}
        onBack={onBack}
        onSubmit={onSubmit}
        {...overrides}
      />
    ),
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(<RouterProvider router={router} />);
}

test("renders account name as back button", async () => {
  renderForm();

  expect(await screen.findByRole("button", { name: /The Winery Bistro/i })).toBeInTheDocument();
});

test("renders New order heading", async () => {
  renderForm();

  expect(await screen.findByRole("heading", { name: "New order" })).toBeInTheDocument();
});

test("renders template items with product names", async () => {
  renderForm();

  expect(await screen.findByText("Rosé")).toBeInTheDocument();
  expect(screen.getByText("Pinot Noir")).toBeInTheDocument();
});

test("renders correct total for each item", async () => {
  renderForm();

  // Rosé: 2 boxes × 6 = 12
  expect(await screen.findByText("12")).toBeInTheDocument();
  // Pinot Noir: 1 box × 12 + 3 units = 15
  expect(screen.getByText("15")).toBeInTheDocument();
});

test("calls onSubmit with mapped payload when submitted with no delivery instructions", async () => {
  renderForm();

  await user.click(await screen.findByRole("button", { name: "Submit order" }));

  expect(onSubmit).toHaveBeenCalledWith({
    templateId: "d4e5f6a7-b8c9-4d0e-9f2a-000000000001",
    deliveryInstructions: null,
    items: [
      { product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000001", boxes: 2, extra_units: 0 },
      { product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000002", boxes: 1, extra_units: 3 },
    ],
  });
});

test("calls onSubmit with the entered delivery instructions", async () => {
  renderForm();

  await user.type(await screen.findByLabelText(/Delivery instructions/i), "Leave at door");
  await user.click(screen.getByRole("button", { name: "Submit order" }));

  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({ deliveryInstructions: "Leave at door" }),
  );
});

test("pre-fills textarea with defaultDeliveryInstructions from account", async () => {
  renderForm({ defaultDeliveryInstructions: "Ring the bell" });

  expect(await screen.findByDisplayValue("Ring the bell")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Submit order" }));

  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({ deliveryInstructions: "Ring the bell" }),
  );
});

test("submits null deliveryInstructions when user clears the pre-filled value", async () => {
  renderForm({ defaultDeliveryInstructions: "Ring the bell" });

  const textarea = await screen.findByDisplayValue("Ring the bell");
  await user.clear(textarea);
  await user.click(screen.getByRole("button", { name: "Submit order" }));

  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ deliveryInstructions: null }));
});

test("calls onBack when the account name button is clicked", async () => {
  renderForm();

  await user.click(await screen.findByRole("button", { name: /The Winery Bistro/i }));

  expect(onBack).toHaveBeenCalledOnce();
});

test("shows Submitting… and disables button while onSubmit is pending", async () => {
  let resolve: () => void;
  const pending = new Promise<void>((r) => {
    resolve = r;
  });
  renderForm({ onSubmit: () => pending });

  await user.click(await screen.findByRole("button", { name: "Submit order" }));

  expect(screen.getByRole("button", { name: "Submitting…" })).toBeDisabled();
  resolve!();
});

test("shows error alert when onSubmit throws", async () => {
  renderForm({ onSubmit: vi.fn().mockRejectedValue(new Error("Network failure")) });

  await user.click(await screen.findByRole("button", { name: "Submit order" }));

  expect(await screen.findByText("Order failed")).toBeInTheDocument();
  expect(
    screen.getByText("Something went wrong submitting your order. Please try again."),
  ).toBeInTheDocument();
});

test("disables submit button when template has no items", async () => {
  renderForm({ template: { ...template, template_items: [] } });

  expect(await screen.findByRole("button", { name: "Submit order" })).toBeDisabled();
});

test("disables submit button when template is null", async () => {
  renderForm({ template: null });

  expect(await screen.findByRole("button", { name: "Submit order" })).toBeDisabled();
});

test("does not render template items when template is null", async () => {
  renderForm({ template: null });

  await screen.findByRole("heading", { name: "New order" });
  expect(screen.queryByText("Rosé")).not.toBeInTheDocument();
  expect(screen.queryByText("Pinot Noir")).not.toBeInTheDocument();
});

// --- Draft items tests ---

test("'Add item' button opens the picker drawer", async () => {
  renderForm();

  await user.click(await screen.findByRole("button", { name: /add item/i }));

  expect(await screen.findByRole("textbox", { name: "Search products" })).toBeInTheDocument();
});

test("adding a product via drawer renders it in the draft items section", async () => {
  renderForm({ template: null });

  await user.click(await screen.findByRole("button", { name: /add item/i }));
  const addButtons = await screen.findAllByRole("button", { name: "Add" });
  await user.click(addButtons[0]);

  expect(screen.getByLabelText(/Remove Chardonnay/i)).toBeInTheDocument();
});

test("removing a draft item removes it from the section", async () => {
  const storedItem: OrderRequestItemInput = {
    product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000003",
    boxes: 1,
    extra_units: 0,
  };
  loadDraftMock.mockReturnValue([storedItem]);

  renderForm({ products: [product1, product2] });

  await user.click(await screen.findByLabelText(/Remove Chardonnay/i));

  expect(screen.queryByLabelText(/Remove Chardonnay/i)).not.toBeInTheDocument();
});

test("submit enabled when only draft items exist (no template)", async () => {
  renderForm({ template: null });

  await user.click(await screen.findByRole("button", { name: /add item/i }));
  const addButtons = await screen.findAllByRole("button", { name: "Add" });
  await user.click(addButtons[0]);
  await user.keyboard("{Escape}");

  expect(await screen.findByRole("button", { name: "Submit order" })).not.toBeDisabled();
});

test("onSubmit is called with both template items and draft items merged", async () => {
  const storedItem: OrderRequestItemInput = {
    product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000003",
    boxes: 3,
    extra_units: 1,
  };
  loadDraftMock.mockReturnValue([storedItem]);

  renderForm();

  await user.click(await screen.findByRole("button", { name: "Submit order" }));

  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({
      items: expect.arrayContaining([
        { product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000001", boxes: 2, extra_units: 0 },
        { product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000003", boxes: 3, extra_units: 1 },
      ]),
    }),
  );
});

test("draft items are loaded from localStorage on mount", async () => {
  const storedItem: OrderRequestItemInput = {
    product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000003",
    boxes: 2,
    extra_units: 0,
  };
  loadDraftMock.mockReturnValue([storedItem]);

  renderForm({ products: [product1, product2] });

  expect(await screen.findByLabelText(/Remove Chardonnay/i)).toBeInTheDocument();
});

test("clearDraft is not called by the form (route's responsibility)", async () => {
  renderForm();

  await user.click(await screen.findByRole("button", { name: "Submit order" }));

  expect(clearDraftMock).not.toHaveBeenCalled();
});

test("saveDraft is called when an item is added", async () => {
  renderForm({ template: null });

  await user.click(await screen.findByRole("button", { name: /add item/i }));
  const addButtons = await screen.findAllByRole("button", { name: "Add" });
  await user.click(addButtons[0]);

  expect(saveDraftMock).toHaveBeenCalledWith(accountId, [
    { product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000003", boxes: 1, extra_units: 0 },
  ]);
});

test("does not load draft from localStorage when persistDraft is false", async () => {
  const storedItem: OrderRequestItemInput = {
    product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000003",
    boxes: 2,
    extra_units: 0,
  };
  loadDraftMock.mockReturnValue([storedItem]);

  renderForm({ persistDraft: false, products: [product1, product2] });

  await screen.findByRole("heading", { name: "New order" });
  expect(loadDraftMock).not.toHaveBeenCalled();
  expect(screen.queryByLabelText(/Remove Chardonnay/i)).not.toBeInTheDocument();
});

test("does not call saveDraft when persistDraft is false and an item is added", async () => {
  renderForm({ persistDraft: false, template: null });

  await user.click(await screen.findByRole("button", { name: /add item/i }));
  const addButtons = await screen.findAllByRole("button", { name: "Add" });
  await user.click(addButtons[0]);

  expect(screen.getByLabelText(/Remove Chardonnay/i)).toBeInTheDocument();
  expect(saveDraftMock).not.toHaveBeenCalled();
});
