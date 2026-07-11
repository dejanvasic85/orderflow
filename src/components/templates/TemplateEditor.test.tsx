import { render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { makeAccount } from "@/test/fixtures/accountFixtures";
import { makeProduct } from "@/test/fixtures/productFixtures";
import { makeTemplateItem, makeTemplateWithItems } from "@/test/fixtures/templateFixtures";
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

const account = makeAccount({ id: "acc-1", name: "Acme Corp" });

const products = [
  makeProduct({ id: "prod-1", name: "Chardonnay", qtyPerBox: 6 }),
  makeProduct({ id: "prod-2", name: "Rosé", qtyPerBox: 12 }),
];

const templateWithOneItem = makeTemplateWithItems({
  id: "tmpl-1",
  accountId: "acc-1",
  name: "Default",
  templateItems: [
    makeTemplateItem({
      id: "item-1",
      templateId: "tmpl-1",
      productId: "prod-1",
      boxCount: 2,
      unitCount: 3,
      product: { id: "prod-1", name: "Chardonnay", qtyPerBox: 6 },
    }),
  ],
});

const onSave = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);

let user: UserEvent;

beforeEach(() => {
  user = userEvent.setup();
});

test("renders existing template items with product name", () => {
  render(
    <TemplateEditor
      account={account}
      template={templateWithOneItem}
      products={products}
      onSave={onSave}
    />,
  );

  expect(screen.getByText("Chardonnay")).toBeInTheDocument();
});

test("save with existing item unchanged sends empty diffs", async () => {
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
      accountId: "acc-1",
      toAdd: [],
      toUpdate: [],
      toRemove: [],
    });
  });
});

test("save after increment sends item in toUpdate", async () => {
  render(
    <TemplateEditor
      account={account}
      template={templateWithOneItem}
      products={products}
      onSave={onSave}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Increase boxes" }));
  await user.click(screen.getByRole("button", { name: /save template/i }));

  await vi.waitFor(() => {
    expect(onSave).toHaveBeenCalledWith({
      accountId: "acc-1",
      toAdd: [],
      toUpdate: [{ id: "item-1", boxCount: 3, unitCount: 3 }],
      toRemove: [],
    });
  });
});

test("save after decrement sends item in toUpdate", async () => {
  render(
    <TemplateEditor
      account={account}
      template={templateWithOneItem}
      products={products}
      onSave={onSave}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Decrease units" }));
  await user.click(screen.getByRole("button", { name: /save template/i }));

  await vi.waitFor(() => {
    expect(onSave).toHaveBeenCalledWith({
      accountId: "acc-1",
      toAdd: [],
      toUpdate: [{ id: "item-1", boxCount: 2, unitCount: 2 }],
      toRemove: [],
    });
  });
});

test("removed item is hidden from the list before save", async () => {
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

test("save after remove sends item id in toRemove", async () => {
  render(
    <TemplateEditor
      account={account}
      template={templateWithOneItem}
      products={products}
      onSave={onSave}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Remove Chardonnay" }));
  await user.click(screen.getByRole("button", { name: /save template/i }));

  await vi.waitFor(() => {
    expect(onSave).toHaveBeenCalledWith({
      accountId: "acc-1",
      toAdd: [],
      toUpdate: [],
      toRemove: ["item-1"],
    });
  });
});

test("save after adding a new product sends item in toAdd", async () => {
  render(<TemplateEditor account={account} template={null} products={products} onSave={onSave} />);

  await user.click(screen.getByRole("button", { name: /add item/i }));
  await user.click(await screen.findByRole("button", { name: "Add Rosé" }));
  await user.click(screen.getByRole("button", { name: /save template/i }));

  await vi.waitFor(() => {
    expect(onSave).toHaveBeenCalledWith({
      accountId: "acc-1",
      toAdd: [{ productId: "prod-2", boxCount: 1, unitCount: 0 }],
      toUpdate: [],
      toRemove: [],
    });
  });
});

test("save with empty template sends all empty diffs", async () => {
  render(<TemplateEditor account={account} template={null} products={products} onSave={onSave} />);

  await user.click(screen.getByRole("button", { name: /save template/i }));

  await vi.waitFor(() => {
    expect(onSave).toHaveBeenCalledWith({
      accountId: "acc-1",
      toAdd: [],
      toUpdate: [],
      toRemove: [],
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
