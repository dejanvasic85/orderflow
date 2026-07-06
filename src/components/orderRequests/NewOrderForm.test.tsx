import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
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

// Products that are in the template
const rose: ProductRow = {
  id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000001",
  name: "Rosé",
  image_url: null,
  qty_per_box: 6,
  active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const pinotNoir: ProductRow = {
  id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000002",
  name: "Pinot Noir",
  image_url: null,
  qty_per_box: 12,
  active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

// Products available in the catalog (not in template)
const product1: ProductRow = {
  id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000003",
  name: "Chardonnay",
  image_url: null,
  qty_per_box: 6,
  active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const product2: ProductRow = {
  id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000004",
  name: "Merlot",
  image_url: null,
  qty_per_box: 12,
  active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const allProducts = [rose, pinotNoir, product1, product2];

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
  loadDraftMock.mockReturnValue(null);
});

function renderForm(overrides?: Partial<React.ComponentProps<typeof NewOrderForm>>) {
  const rootRoute = createRootRoute({
    component: () => (
      <NewOrderForm
        accountId={accountId}
        accountName="The Winery Bistro"
        defaultDeliveryAddress={null}
        defaultDeliveryInstructions={null}
        template={template}
        products={allProducts}
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
  expect(await screen.findByLabelText("Total 12")).toBeInTheDocument();
  // Pinot Noir: 1 box × 12 + 3 units = 15
  expect(screen.getByLabelText("Total 15")).toBeInTheDocument();
});

test("calls onSubmit with mapped payload when submitted with no delivery instructions", async () => {
  renderForm();

  await user.click(await screen.findByRole("button", { name: "Submit order" }));

  expect(onSubmit).toHaveBeenCalledWith({
    templateId: "d4e5f6a7-b8c9-4d0e-9f2a-000000000001",
    deliveryAddress: null,
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

test("pre-fills the address field with defaultDeliveryAddress from account", async () => {
  renderForm({ defaultDeliveryAddress: "12 Vine St, Hawthorn" });

  expect(await screen.findByDisplayValue("12 Vine St, Hawthorn")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Submit order" }));

  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({ deliveryAddress: "12 Vine St, Hawthorn" }),
  );
});

test("calls onSubmit with an edited delivery address", async () => {
  renderForm({ defaultDeliveryAddress: "12 Vine St, Hawthorn" });

  const addressField = await screen.findByDisplayValue("12 Vine St, Hawthorn");
  await user.clear(addressField);
  await user.type(addressField, "99 Cellar Rd, Richmond");
  await user.click(screen.getByRole("button", { name: "Submit order" }));

  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({ deliveryAddress: "99 Cellar Rd, Richmond" }),
  );
});

test("submits null deliveryAddress when user clears the pre-filled value", async () => {
  renderForm({ defaultDeliveryAddress: "12 Vine St, Hawthorn" });

  const addressField = await screen.findByDisplayValue("12 Vine St, Hawthorn");
  await user.clear(addressField);
  await user.click(screen.getByRole("button", { name: "Submit order" }));

  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ deliveryAddress: null }));
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

test("stays disabled after onSubmit resolves so it does not flash before navigation", async () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  renderForm({ onSubmit });

  await user.click(await screen.findByRole("button", { name: "Submit order" }));

  await vi.waitFor(() => expect(onSubmit).toHaveBeenCalled());
  expect(screen.getByRole("button", { name: "Submitting…" })).toBeDisabled();
  expect(screen.queryByRole("button", { name: "Submit order" })).not.toBeInTheDocument();
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

test("adding a product via drawer renders it in the order items section", async () => {
  renderForm({ template: null });

  await user.click(await screen.findByRole("button", { name: /add item/i }));
  const addButtons = await screen.findAllByRole("button", { name: "Add" });
  await user.click(addButtons[0]);

  expect(screen.getByLabelText(/Remove Rosé/i)).toBeInTheDocument();
});

test("removing an item removes it from the list", async () => {
  // Saved draft includes both template items and an extra catalog item — the draft
  // is the full source of truth, so all three appear on load.
  const savedDraft: OrderRequestItemInput[] = [
    { product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000001", boxes: 2, extra_units: 0 }, // Rosé (template)
    { product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000003", boxes: 1, extra_units: 0 }, // Chardonnay (catalog)
  ];
  loadDraftMock.mockReturnValue(savedDraft);

  renderForm({ products: allProducts });

  await user.click(await screen.findByLabelText(/Remove Chardonnay/i));

  expect(await screen.findByLabelText(/Remove Rosé/i)).toBeInTheDocument();
  await waitFor(() =>
    expect(screen.queryByLabelText(/Remove Chardonnay/i)).not.toBeInTheDocument(),
  );
});

test("submit enabled when only draft items exist (no template)", async () => {
  renderForm({ template: null });

  await user.click(await screen.findByRole("button", { name: /add item/i }));
  const addButtons = await screen.findAllByRole("button", { name: "Add" });
  await user.click(addButtons[0]);
  await user.keyboard("{Escape}");

  expect(await screen.findByRole("button", { name: "Submit order" })).not.toBeDisabled();
});

test("onSubmit uses the saved draft as the complete item list", async () => {
  // Draft is the full source of truth: template item at modified quantity + extra catalog item.
  const savedDraft: OrderRequestItemInput[] = [
    { product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000001", boxes: 5, extra_units: 0 }, // Rosé — user changed from 2→5
    { product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000003", boxes: 3, extra_units: 1 }, // Chardonnay — catalog item
  ];
  loadDraftMock.mockReturnValue(savedDraft);

  renderForm();

  await user.click(await screen.findByRole("button", { name: "Submit order" }));

  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({
      items: [
        { product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000001", boxes: 5, extra_units: 0 },
        { product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000003", boxes: 3, extra_units: 1 },
      ],
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

  renderForm({ products: allProducts });

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
    { product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000001", boxes: 1, extra_units: 0 },
  ]);
});

test("does not load draft from localStorage when persistDraft is false", async () => {
  const storedItem: OrderRequestItemInput = {
    product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000003",
    boxes: 2,
    extra_units: 0,
  };
  loadDraftMock.mockReturnValue([storedItem]);

  renderForm({ persistDraft: false, products: allProducts });

  await screen.findByRole("heading", { name: "New order" });
  expect(loadDraftMock).not.toHaveBeenCalled();
  expect(screen.queryByLabelText(/Remove Chardonnay/i)).not.toBeInTheDocument();
});

test("does not call saveDraft when persistDraft is false and an item is added", async () => {
  renderForm({ persistDraft: false, template: null });

  await user.click(await screen.findByRole("button", { name: /add item/i }));
  const addButtons = await screen.findAllByRole("button", { name: "Add" });
  await user.click(addButtons[0]);

  expect(screen.getByLabelText(/Remove Rosé/i)).toBeInTheDocument();
  expect(saveDraftMock).not.toHaveBeenCalled();
});

// --- initialItems (re-order) tests ---

test("initialItems overrides template items", async () => {
  const initialItems: OrderRequestItemInput[] = [
    { product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000003", boxes: 3, extra_units: 1 },
  ];

  renderForm({ initialItems });

  // Template items (Rosé, Pinot Noir) should NOT appear
  await screen.findByRole("heading", { name: "New order" });
  expect(screen.queryByText("Rosé")).not.toBeInTheDocument();
  expect(screen.queryByText("Pinot Noir")).not.toBeInTheDocument();
  // The re-order item (Chardonnay) should appear
  expect(screen.getByLabelText(/Remove Chardonnay/i)).toBeInTheDocument();
});

// --- Zero-quantity item tests ---

test("disables submit button when every item has 0 boxes and 0 units", async () => {
  const initialItems: OrderRequestItemInput[] = [
    { product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000001", boxes: 0, extra_units: 0 },
    { product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000002", boxes: 0, extra_units: 0 },
  ];

  renderForm({ initialItems });

  expect(await screen.findByRole("button", { name: "Submit order" })).toBeDisabled();
});

test("enables submit button when at least one item has a non-zero total", async () => {
  const initialItems: OrderRequestItemInput[] = [
    { product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000001", boxes: 0, extra_units: 0 },
    { product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000002", boxes: 1, extra_units: 0 },
  ];

  renderForm({ initialItems });

  expect(await screen.findByRole("button", { name: "Submit order" })).not.toBeDisabled();
});

test("enables submit button when an item has 0 boxes but non-zero units", async () => {
  const initialItems: OrderRequestItemInput[] = [
    { product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000001", boxes: 0, extra_units: 2 },
  ];

  renderForm({ initialItems });

  expect(await screen.findByRole("button", { name: "Submit order" })).not.toBeDisabled();
});

test("omits zero-quantity items from the submitted payload", async () => {
  const initialItems: OrderRequestItemInput[] = [
    { product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000001", boxes: 0, extra_units: 0 },
    { product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000002", boxes: 1, extra_units: 3 },
  ];

  renderForm({ initialItems });

  await user.click(await screen.findByRole("button", { name: "Submit order" }));

  expect(onSubmit).toHaveBeenCalledWith(
    expect.objectContaining({
      items: [{ product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000002", boxes: 1, extra_units: 3 }],
    }),
  );
});

test("keeps zero-quantity items visible in the form after a non-zero item is submitted", async () => {
  const initialItems: OrderRequestItemInput[] = [
    { product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000001", boxes: 0, extra_units: 0 },
    { product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000002", boxes: 1, extra_units: 0 },
  ];

  renderForm({ initialItems });

  await user.click(await screen.findByRole("button", { name: "Submit order" }));

  expect(await screen.findByText("Rosé")).toBeInTheDocument();
});

test("initialItems overrides a saved draft", async () => {
  const savedDraft: OrderRequestItemInput[] = [
    { product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000001", boxes: 5, extra_units: 0 },
  ];
  loadDraftMock.mockReturnValue(savedDraft);

  const initialItems: OrderRequestItemInput[] = [
    { product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000003", boxes: 2, extra_units: 0 },
  ];

  renderForm({ initialItems });

  // Draft item (Rosé) should NOT appear
  await screen.findByRole("heading", { name: "New order" });
  expect(screen.queryByText("Rosé")).not.toBeInTheDocument();
  // Re-order item (Chardonnay) should appear
  expect(screen.getByLabelText(/Remove Chardonnay/i)).toBeInTheDocument();
});
