import type { User } from "@/lib/users/schema";

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "u-1",
    name: "Alice Smith",
    email: "alice@example.com",
    phone: null,
    active: true,
    role: "user",
    inviteAcceptedAt: null,
    invitedAt: null,
    notificationPreferences: { email: true, sms: false },
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    accounts: [],
    ...overrides,
  };
}

import type { AccountUser } from "@/lib/accounts/schema";

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
