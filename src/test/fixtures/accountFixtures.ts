import type { Account, AccountUser } from "@/lib/accounts/schema";

export function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: "acc-1",
    name: "Acme Wines",
    contactName: null,
    contactEmail: null,
    contactPhone: null,
    deliveryAddress: null,
    deliveryInstructions: null,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    userCount: 0,
    ...overrides,
  };
}

// The abbreviated account embed carried on orders, templates and dashboard rows.
type AccountRef = { id: string; name: string };

export function makeAccountRef(overrides: Partial<AccountRef> = {}): AccountRef {
  return {
    id: "acc-1",
    name: "Acme Wines",
    ...overrides,
  };
}

export function makeAccountUser(overrides: Partial<AccountUser> = {}): AccountUser {
  return {
    userId: "u-1",
    createdAt: "2024-01-01T00:00:00Z",
    user: {
      id: "u-1",
      name: "Alice Smith",
      email: "alice@example.com",
      role: "user",
    },
    ...overrides,
  };
}
