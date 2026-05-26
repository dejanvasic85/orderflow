import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CreateOrderRequestInput } from "@/lib/orderRequests/schema";
import type { TemplateWithItems } from "@/lib/templates/schema";
import { NewOrderForm } from "./NewOrderForm";

const template: TemplateWithItems = {
  id: "d4e5f6a7-b8c9-4d0e-9f2a-000000000001",
  account_id: "b2c3d4e5-f6a7-4b8c-9d0e-000000000a01",
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
      bottle_count: 0,
      created_by: null,
      created_at: "2024-01-01T00:00:00Z",
      products: { id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000001", name: "Rosé", qty_per_box: 6 },
    },
    {
      id: "item-2",
      template_id: "d4e5f6a7-b8c9-4d0e-9f2a-000000000001",
      product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000002",
      box_count: 1,
      bottle_count: 3,
      created_by: null,
      created_at: "2024-01-01T00:00:00Z",
      products: { id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000002", name: "Pinot Noir", qty_per_box: 12 },
    },
  ],
};

const onSubmit = vi.fn().mockResolvedValue(undefined);

function renderForm(overrides?: Partial<React.ComponentProps<typeof NewOrderForm>>) {
  const rootRoute = createRootRoute({
    component: () => (
      <NewOrderForm
        accountId="b2c3d4e5-f6a7-4b8c-9d0e-000000000a01"
        accountName="The Winery Bistro"
        template={template}
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

test("renders account name as back link", async () => {
  renderForm();

  expect(await screen.findByRole("link", { name: /The Winery Bistro/i })).toBeInTheDocument();
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
  // Pinot Noir: 1 box × 12 + 3 bottles = 15
  expect(screen.getByText("15")).toBeInTheDocument();
});

test("calls onSubmit with mapped payload when submitted with no note", async () => {
  const user = userEvent.setup();
  renderForm();

  await user.click(await screen.findByRole("button", { name: "Submit order" }));

  expect(onSubmit).toHaveBeenCalledWith({
    account_id: "b2c3d4e5-f6a7-4b8c-9d0e-000000000a01",
    template_id: "d4e5f6a7-b8c9-4d0e-9f2a-000000000001",
    note: null,
    items: [
      { product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000001", boxes: 2, extra_bottles: 0 },
      { product_id: "c3d4e5f6-a7b8-4c9d-8e1f-000000000002", boxes: 1, extra_bottles: 3 },
    ],
  } satisfies CreateOrderRequestInput);
});

test("calls onSubmit with the entered note", async () => {
  const user = userEvent.setup();
  renderForm();

  await user.type(
    await screen.findByPlaceholderText("Any special instructions..."),
    "Leave at door",
  );
  await user.click(screen.getByRole("button", { name: "Submit order" }));

  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ note: "Leave at door" }));
});

test("shows Submitting… and disables button while onSubmit is pending", async () => {
  const user = userEvent.setup();
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
  const user = userEvent.setup();
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
