import { render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import type { Account } from "@/lib/accounts/schema";
import type { ProductRow } from "@/lib/products/schema";
import type { TemplateWithItems } from "@/lib/templates/schema";
import { TemplateEditor } from "./TemplateEditor";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: { children: React.ReactNode; to: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/orderRequests/CatalogPickerDrawer", () => ({
  CatalogPickerDrawer: ({ open, onAdd }: { open: boolean; onAdd: (id: string) => void }) => {
    if (!open) return null;
    return (
      <div role="dialog" aria-label="Add item">
        <button type="button" onClick={() => onAdd("prod-2")}>
          Add Rosé
        </button>
      </div>
    );
  },
}));

const account: Account = {
  id: "acc-1",
  name: "Acme Corp",
  contact_name: null,
  contact_email: null,
  contact_phone: null,
  delivery_address: null,
  delivery_instructions: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  userCount: 0,
};

const products: ProductRow[] = [
  {
    id: "prod-1",
    name: "Chardonnay",
    description: null,
    image_url: null,
    qty_per_box: 6,
    active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "prod-2",
    name: "Rosé",
    description: null,
    image_url: null,
    qty_per_box: 12,
    active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

const templateWithOneItem: TemplateWithItems = {
  id: "tmpl-1",
  account_id: "acc-1",
  name: "Default",
  created_by: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  template_items: [
    {
      id: "item-1",
      template_id: "tmpl-1",
      product_id: "prod-1",
      box_count: 2,
      bottle_count: 3,
      created_by: null,
      created_at: "2024-01-01T00:00:00Z",
      products: { id: "prod-1", name: "Chardonnay", qty_per_box: 6 },
    },
  ],
};

const onSave = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);

let user: UserEvent;

beforeEach(() => {
  user = userEvent.setup();
});

test("renders existing template items with product name and boxes/bottles", () => {
  render(
    <TemplateEditor
      account={account}
      template={templateWithOneItem}
      products={products}
      onSave={onSave}
    />,
  );

  expect(screen.getByText("Chardonnay")).toBeInTheDocument();
  expect(screen.getByText("2")).toBeInTheDocument();
  expect(screen.getByText("3")).toBeInTheDocument();
});

test("incrementing boxes updates the displayed count", async () => {
  render(
    <TemplateEditor
      account={account}
      template={templateWithOneItem}
      products={products}
      onSave={onSave}
    />,
  );

  const increaseBoxes = screen.getByRole("button", { name: "Increase boxes" });
  await user.click(increaseBoxes);

  // After increment: boxes=3, bottles=3 — assert onSave is called with the right value
  await user.click(screen.getByRole("button", { name: /save template/i }));
  await vi.waitFor(() => {
    expect(onSave).toHaveBeenCalledWith({
      account_id: "acc-1",
      items: [{ product_id: "prod-1", box_count: 3, bottle_count: 3 }],
    });
  });
});

test("decrementing bottles updates the displayed count", async () => {
  render(
    <TemplateEditor
      account={account}
      template={templateWithOneItem}
      products={products}
      onSave={onSave}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Decrease bottles" }));

  // After decrement: boxes=2, bottles=2 — assert onSave is called with the right value
  await user.click(screen.getByRole("button", { name: /save template/i }));
  await vi.waitFor(() => {
    expect(onSave).toHaveBeenCalledWith({
      account_id: "acc-1",
      items: [{ product_id: "prod-1", box_count: 2, bottle_count: 2 }],
    });
  });
});

test("removing an item removes it from the list", async () => {
  render(
    <TemplateEditor
      account={account}
      template={templateWithOneItem}
      products={products}
      onSave={onSave}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Remove Chardonnay" }));

  expect(screen.queryByText("Chardonnay")).not.toBeInTheDocument();
});

test("clicking Add item opens the picker and adding a product shows a new card", async () => {
  render(<TemplateEditor account={account} template={null} products={products} onSave={onSave} />);

  await user.click(screen.getByRole("button", { name: /add item/i }));
  await user.click(await screen.findByRole("button", { name: "Add Rosé" }));

  expect(screen.getByText("Rosé")).toBeInTheDocument();
});

test("Save template calls onSave with mapped payload", async () => {
  render(
    <TemplateEditor
      account={account}
      template={templateWithOneItem}
      products={products}
      onSave={onSave}
    />,
  );

  await user.click(screen.getByRole("button", { name: /save template/i }));

  await vi.waitFor(() => {
    expect(onSave).toHaveBeenCalledWith({
      account_id: "acc-1",
      items: [{ product_id: "prod-1", box_count: 2, bottle_count: 3 }],
    });
  });
});

test("Save template with empty template calls onSave with items: []", async () => {
  render(<TemplateEditor account={account} template={null} products={products} onSave={onSave} />);

  await user.click(screen.getByRole("button", { name: /save template/i }));

  await vi.waitFor(() => {
    expect(onSave).toHaveBeenCalledWith({
      account_id: "acc-1",
      items: [],
    });
  });
});

test("readOnly mode shows items without edit controls and no Save or Add buttons", () => {
  render(
    <TemplateEditor
      account={account}
      template={templateWithOneItem}
      products={products}
      readOnly
      onSave={onSave}
    />,
  );

  expect(screen.getByText("Chardonnay")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /save template/i })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /add item/i })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /increase boxes/i })).not.toBeInTheDocument();
  expect(screen.getByText(/read-only/i)).toBeInTheDocument();
});

test("readOnly with empty template shows empty message", () => {
  render(
    <TemplateEditor
      account={account}
      template={null}
      products={products}
      readOnly
      onSave={onSave}
    />,
  );

  expect(screen.getByText(/no items in this template/i)).toBeInTheDocument();
});

test("renders Accounts back link pointing to the accounts list", () => {
  render(<TemplateEditor account={account} template={null} products={products} onSave={onSave} />);

  const backLink = screen.getByRole("link", { name: /accounts/i });
  expect(backLink).toBeInTheDocument();
  expect(backLink).toHaveAttribute("href", "/manage/accounts");
});
