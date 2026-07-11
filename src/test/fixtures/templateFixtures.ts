import type { TemplateItem, TemplateWithItems } from "@/lib/templates/schema";

export function makeTemplateItem(overrides: Partial<TemplateItem> = {}): TemplateItem {
  return {
    id: "titem-1",
    templateId: "tpl-1",
    productId: "p-1",
    boxCount: 1,
    unitCount: 0,
    createdBy: null,
    createdAt: "2024-01-01T00:00:00Z",
    product: { id: "p-1", name: "Shiraz", qtyPerBox: 6 },
    ...overrides,
  };
}

export function makeTemplateWithItems(
  overrides: Partial<TemplateWithItems> = {},
): TemplateWithItems {
  return {
    id: "tpl-1",
    accountId: "acc-1",
    name: "Standard order",
    createdBy: null,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    templateItems: [],
    ...overrides,
  };
}
