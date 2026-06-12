import { act, render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import type { User } from "@/lib/users/schema";
import { UserList } from "./UserList";

const adminUser: User = {
  id: "1",
  name: "Alice Admin",
  email: "alice@example.com",
  phone: null,
  active: true,
  invite_accepted_at: "2024-01-02T00:00:00Z",
  invited_at: "2024-01-01T00:00:00Z",
  role: "admin",
  notificationPreferences: { email: true, sms: false },
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  accounts: [{ id: "acc-1", name: "Acme" }],
};

const staffUser: User = {
  id: "2",
  name: "Bob Staff",
  email: "bob@example.com",
  phone: null,
  active: false,
  invite_accepted_at: "2024-01-02T00:00:00Z",
  invited_at: "2024-01-01T00:00:00Z",
  role: "staff",
  notificationPreferences: { email: false, sms: false },
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  accounts: [],
};

const pendingUser: User = {
  id: "3",
  name: "Carol Pending",
  email: "carol@example.com",
  phone: null,
  active: true,
  invite_accepted_at: null,
  invited_at: "2024-01-01T00:00:00Z",
  role: "user",
  notificationPreferences: { email: true, sms: false },
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  accounts: [],
};

const onSelectUser = vi.fn();
const onRoleFilterChange = vi.fn();
const onSearchChange = vi.fn();
const onPageChange = vi.fn();

let user: UserEvent;

beforeEach(() => {
  user = userEvent.setup();
});

function renderList(overrides: Partial<Parameters<typeof UserList>[0]> = {}) {
  return render(
    <UserList
      users={[adminUser, staffUser]}
      selectedId={null}
      roleFilter="all"
      searchQuery=""
      currentPage={1}
      totalPages={1}
      onSelectUser={onSelectUser}
      onRoleFilterChange={onRoleFilterChange}
      onSearchChange={onSearchChange}
      onPageChange={onPageChange}
      {...overrides}
    />,
  );
}

test("renders all users passed as props", () => {
  renderList();

  expect(screen.getByText("Alice Admin")).toBeInTheDocument();
  expect(screen.getByText("Bob Staff")).toBeInTheDocument();
});

test("renders all role filter buttons", () => {
  renderList({ users: [] });

  expect(screen.getByRole("button", { name: "All roles" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Admin" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Staff" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "User" })).toBeInTheDocument();
});

test("calls onRoleFilterChange with the clicked filter value", async () => {
  renderList({ users: [] });

  await user.click(screen.getByRole("button", { name: "Staff" }));

  expect(onRoleFilterChange).toHaveBeenCalledWith("staff");
});

test("calls onSelectUser when a row is clicked", async () => {
  renderList({ users: [adminUser] });

  await user.click(screen.getByText("Alice Admin"));

  expect(onSelectUser).toHaveBeenCalledWith(adminUser);
});

test("calls onSelectUser when the Edit button is clicked", async () => {
  renderList({ users: [adminUser] });

  await user.click(screen.getByRole("button", { name: "Edit" }));

  expect(onSelectUser).toHaveBeenCalledWith(adminUser);
});

test("shows account count when user has accounts", () => {
  renderList({ users: [adminUser] });

  expect(screen.getByText("1")).toBeInTheDocument();
});

test("shows dash when user has no accounts", () => {
  renderList({ users: [staffUser] });

  expect(screen.getByText("—")).toBeInTheDocument();
});

test("shows Active badge for active users", () => {
  renderList({ users: [adminUser] });

  expect(screen.getByText("Active")).toBeInTheDocument();
});

test("shows Inactive badge for inactive users", () => {
  renderList({ users: [staffUser] });

  expect(screen.getByText("Inactive")).toBeInTheDocument();
});

test("shows Pending badge for active users who have not accepted their invite", () => {
  renderList({ users: [pendingUser] });

  expect(screen.getByText("Pending")).toBeInTheDocument();
});

test("shows empty message when users is empty and no search or filter is active", () => {
  renderList({ users: [], searchQuery: "", roleFilter: "all" });

  expect(screen.getByText("No users found")).toBeInTheDocument();
});

test("shows no-results message when users is empty and searchQuery is set", () => {
  renderList({ users: [], searchQuery: "foo", roleFilter: "all" });

  expect(screen.getByText("No users match your search")).toBeInTheDocument();
});

test("shows no-results message when users is empty and a role filter is active", () => {
  renderList({ users: [], searchQuery: "", roleFilter: "admin" });

  expect(screen.getByText("No users match your search")).toBeInTheDocument();
});

test("calls onSearchChange after 300ms debounce when user types", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  const debouncedUser = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });

  renderList({ users: [] });

  const input = screen.getByPlaceholderText("Search by name or email...");
  await debouncedUser.type(input, "alice");

  await act(async () => {
    vi.runAllTimers();
  });

  expect(onSearchChange).toHaveBeenCalledWith("alice");

  vi.useRealTimers();
});

test("does not call onSearchChange on mount when input matches the search query", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });

  renderList({ searchQuery: "alice" });

  await act(async () => {
    vi.runAllTimers();
  });

  expect(onSearchChange).not.toHaveBeenCalled();

  vi.useRealTimers();
});

test("shows skeleton rows when isLoading is true", () => {
  renderList({ isLoading: true, users: [] });

  const rows = screen.getAllByRole("row");
  // 1 header row + 3 skeleton rows
  expect(rows).toHaveLength(4);
});

test("hides pagination when totalPages is 1", () => {
  renderList({ currentPage: 1, totalPages: 1 });

  expect(screen.queryByRole("button", { name: "Previous" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
});

test("shows pagination controls when totalPages is greater than 1", () => {
  renderList({ currentPage: 1, totalPages: 3 });

  expect(screen.getByRole("button", { name: "Previous" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
  expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
});

test("disables Previous button on first page", () => {
  renderList({ currentPage: 1, totalPages: 3 });

  expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
});

test("disables Next button on last page", () => {
  renderList({ currentPage: 3, totalPages: 3 });

  expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
});

test("calls onPageChange with previous page when Previous is clicked", async () => {
  renderList({ currentPage: 2, totalPages: 3 });

  await user.click(screen.getByRole("button", { name: "Previous" }));

  expect(onPageChange).toHaveBeenCalledWith(1);
});

test("calls onPageChange with next page when Next is clicked", async () => {
  renderList({ currentPage: 2, totalPages: 3 });

  await user.click(screen.getByRole("button", { name: "Next" }));

  expect(onPageChange).toHaveBeenCalledWith(3);
});
