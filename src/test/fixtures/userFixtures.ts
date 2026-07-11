import type { User } from "@/lib/users/schema";
import type { ListedRow } from "@/lib/users/users.repository";

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

// Snake_case repository-row variant, as returned by the users repository and
// consumed by mapUser in service tests. Distinct from the camelCase `User`.
export function makeUserRow(overrides: Partial<ListedRow> = {}): ListedRow {
  return {
    id: "u-1",
    name: "Alice Smith",
    email: "alice@example.com",
    phone: null,
    active: true,
    invite_accepted_at: null,
    invited_at: null,
    role: "user",
    notification_preferences: { email: true, sms: false },
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    account_users: [],
    ...overrides,
  };
}
