import type { DashboardOrder } from "@/lib/dashboard/schema";

export function makeDashboardOrder(overrides: Partial<DashboardOrder> = {}): DashboardOrder {
  return {
    id: "order-1",
    orderNumber: 1,
    createdAt: "2026-06-01T10:00:00Z",
    accountId: "acc-1",
    placedBy: "user-1",
    items: [],
    account: { id: "acc-1", name: "Acme Wines" },
    user: { id: "user-1", name: "Tom Reynolds", role: "user" },
    ...overrides,
  };
}
