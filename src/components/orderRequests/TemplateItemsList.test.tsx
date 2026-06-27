import { render, screen } from "@testing-library/react";
import type { TemplateWithItems } from "@/lib/templates/schema";
import { TemplateItemsList } from "./TemplateItemsList";

const template: TemplateWithItems = {
  id: "tmpl-1",
  account_id: "acct-1",
  name: "Weekly Pack",
  created_by: "user-1",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  template_items: [
    {
      id: "item-1",
      template_id: "tmpl-1",
      product_id: "prod-1",
      box_count: 2,
      unit_count: 0,
      created_by: null,
      created_at: "2024-01-01T00:00:00Z",
      products: { id: "prod-1", name: "Rosé", qty_per_box: 6 },
    },
    {
      id: "item-2",
      template_id: "tmpl-1",
      product_id: "prod-2",
      box_count: 1,
      unit_count: 3,
      created_by: null,
      created_at: "2024-01-01T00:00:00Z",
      products: { id: "prod-2", name: "Pinot Noir", qty_per_box: 12 },
    },
  ],
};

test("renders the Template Items heading", () => {
  render(<TemplateItemsList template={template} />);

  expect(screen.getByRole("heading", { name: "Template Items" })).toBeInTheDocument();
});

test("renders the admin contact message", () => {
  render(<TemplateItemsList template={template} />);

  expect(
    screen.getByText("To make changes to the ordering template, contact your admin."),
  ).toBeInTheDocument();
});

test("renders each item's product name", () => {
  render(<TemplateItemsList template={template} />);

  expect(screen.getByText("Rosé")).toBeInTheDocument();
  expect(screen.getByText("Pinot Noir")).toBeInTheDocument();
});

test("renders nothing when template_items is empty", () => {
  const emptyTemplate: TemplateWithItems = { ...template, template_items: [] };
  const { container } = render(<TemplateItemsList template={emptyTemplate} />);

  expect(container).toBeEmptyDOMElement();
});
