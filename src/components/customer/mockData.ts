export type MockAccount = {
  id: string;
  name: string;
  lastOrderAt: string | null;
};

export type MockOrder = {
  id: string;
  accountId: string;
  orderNumber: string;
  placedAt: string;
  summary: string;
  totalBottles: number;
  placedByName: string;
  placedByUserId: string;
};

export const mockCustomerAccounts: MockAccount[] = [
  { id: "a1", name: "The Winery Bistro", lastOrderAt: "2026-04-26T09:00:00Z" },
  { id: "a2", name: "Harbour Hotel", lastOrderAt: "2026-04-19T14:30:00Z" },
  { id: "a3", name: "Cellar Door Co.", lastOrderAt: "2026-04-12T11:00:00Z" },
];

export const mockOrders: MockOrder[] = [
  {
    id: "o1",
    accountId: "a1",
    orderNumber: "ORD-0041",
    placedAt: "2026-04-26T09:00:00Z",
    summary: "Weekly wine pack",
    totalBottles: 30,
    placedByName: "Sarah Mitchell",
    placedByUserId: "u2",
  },
  {
    id: "o2",
    accountId: "a1",
    orderNumber: "ORD-0038",
    placedAt: "2026-04-18T14:00:00Z",
    summary: "Spirits top-up",
    totalBottles: 18,
    placedByName: "Tom Reynolds",
    placedByUserId: "u3",
  },
  {
    id: "o3",
    accountId: "a1",
    orderNumber: "ORD-0034",
    placedAt: "2026-04-10T10:00:00Z",
    summary: "Beer fridge restock",
    totalBottles: 24,
    placedByName: "Sarah Mitchell",
    placedByUserId: "u2",
  },
  {
    id: "o4",
    accountId: "a2",
    orderNumber: "ORD-0039",
    placedAt: "2026-04-19T14:30:00Z",
    summary: "House white selection",
    totalBottles: 48,
    placedByName: "Sarah Mitchell",
    placedByUserId: "u2",
  },
  {
    id: "o5",
    accountId: "a3",
    orderNumber: "ORD-0033",
    placedAt: "2026-04-12T11:00:00Z",
    summary: "Cellar reserve pack",
    totalBottles: 12,
    placedByName: "Tom Reynolds",
    placedByUserId: "u3",
  },
];

// Simulates the current viewer's user id
export const currentViewerUserId = "u2";
