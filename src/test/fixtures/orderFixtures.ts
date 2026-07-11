import type {
  CreateOrderRequestInput,
  OrderHistoryItem,
  OrderHistoryRow,
  OrderRequestItem,
  OrderRequestWithItems,
} from "@/lib/orderRequests/schema";
import { makeProductRef } from "./productFixtures";

export function makeOrderRequestItem(overrides: Partial<OrderRequestItem> = {}): OrderRequestItem {
  return {
    id: "item-1",
    productId: "p-1",
    boxes: 2,
    extraUnits: 0,
    createdAt: "2024-01-01T00:00:00Z",
    product: makeProductRef(),
    ...overrides,
  };
}

export function makeOrderRequestWithItems(
  overrides: Partial<OrderRequestWithItems> = {},
): OrderRequestWithItems {
  return {
    id: "order-1",
    orderNumber: 42,
    accountId: "acc-1",
    placedBy: "u-1",
    templateId: null,
    deliveryAddress: null,
    deliveryInstructions: null,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    orderRequestItems: [makeOrderRequestItem()],
    template: null,
    user: { id: "u-1", name: "Alice Smith" },
    account: { id: "acc-1", name: "Acme Wines" },
    ...overrides,
  };
}

export function makeOrderHistoryItem(overrides: Partial<OrderHistoryItem> = {}): OrderHistoryItem {
  return {
    id: "order-1",
    orderNumber: 42,
    placedBy: "u-1",
    placedByName: "Alice Smith",
    createdAt: "2024-01-01T00:00:00Z",
    totalUnits: 0,
    totalBoxes: 2,
    ...overrides,
  };
}

export function makeOrderHistoryRow(overrides: Partial<OrderHistoryRow> = {}): OrderHistoryRow {
  return {
    id: "order-1",
    orderNumber: 42,
    placedBy: "u-1",
    createdAt: "2024-01-01T00:00:00Z",
    items: [],
    user: { id: "u-1", name: "Alice Smith", role: "user" },
    ...overrides,
  };
}

export function makeCreateOrderRequestInput(
  overrides: Partial<CreateOrderRequestInput> = {},
): CreateOrderRequestInput {
  return {
    accountId: "acc-1",
    items: [{ productId: "p-1", boxes: 2, extraUnits: 1 }],
    ...overrides,
  };
}
