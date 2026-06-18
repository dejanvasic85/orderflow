import type { User } from "@/lib/users/schema";

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "u-1",
    name: "Alice Smith",
    email: "alice@example.com",
    phone: null,
    active: true,
    role: "user",
    invite_accepted_at: null,
    invited_at: null,
    notificationPreferences: { email: true, sms: false },
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    accounts: [],
    ...overrides,
  };
}

type AccountUserRow = {
  user_id: string;
  created_at: string;
  users: {
    id: string;
    name: string;
    email: string | null;
    role: "admin" | "staff" | "user" | null;
    active: boolean | null;
  };
};

export function makeAccountUserRow(overrides: Partial<AccountUserRow> = {}): AccountUserRow {
  return {
    user_id: "u-1",
    created_at: "2024-01-01T00:00:00Z",
    users: {
      id: "u-1",
      name: "Alice Smith",
      email: "alice@example.com",
      role: "user",
      active: true,
    },
    ...overrides,
  };
}
