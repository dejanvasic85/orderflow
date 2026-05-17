import { render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import type { User } from "@/lib/users/schema";
import { UserList } from "./UserList";

const adminUser: User = {
  id: "1",
  name: "Alice Admin",
  email: "alice@example.com",
  phone: null,
  active: true,
  role: "admin",
  notification_preferences: { email: true, sms: false },
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
  role: "staff",
  notification_preferences: { email: false, sms: false },
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  accounts: [],
};

const onSelectUser = vi.fn();
const onRoleFilterChange = vi.fn();

let user: UserEvent;

beforeEach(() => {
  user = userEvent.setup();
});

test("renders all users when roleFilter is 'all'", () => {
  render(
    <UserList
      users={[adminUser, staffUser]}
      selectedId={null}
      roleFilter="all"
      onSelectUser={onSelectUser}
      onRoleFilterChange={onRoleFilterChange}
    />,
  );

  expect(screen.getByText("Alice Admin")).toBeInTheDocument();
  expect(screen.getByText("Bob Staff")).toBeInTheDocument();
});

test("renders only matching users when roleFilter is 'admin'", () => {
  render(
    <UserList
      users={[adminUser, staffUser]}
      selectedId={null}
      roleFilter="admin"
      onSelectUser={onSelectUser}
      onRoleFilterChange={onRoleFilterChange}
    />,
  );

  expect(screen.getByText("Alice Admin")).toBeInTheDocument();
  expect(screen.queryByText("Bob Staff")).not.toBeInTheDocument();
});

test("renders all role filter buttons", () => {
  render(
    <UserList
      users={[]}
      selectedId={null}
      roleFilter="all"
      onSelectUser={onSelectUser}
      onRoleFilterChange={onRoleFilterChange}
    />,
  );

  expect(screen.getByRole("button", { name: "All roles" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Admin" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Staff" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "User" })).toBeInTheDocument();
});

test("calls onRoleFilterChange with the clicked filter value", async () => {
  render(
    <UserList
      users={[]}
      selectedId={null}
      roleFilter="all"
      onSelectUser={onSelectUser}
      onRoleFilterChange={onRoleFilterChange}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Staff" }));

  expect(onRoleFilterChange).toHaveBeenCalledWith("staff");
});

test("calls onSelectUser when a row is clicked", async () => {
  render(
    <UserList
      users={[adminUser]}
      selectedId={null}
      roleFilter="all"
      onSelectUser={onSelectUser}
      onRoleFilterChange={onRoleFilterChange}
    />,
  );

  await user.click(screen.getByText("Alice Admin"));

  expect(onSelectUser).toHaveBeenCalledWith(adminUser);
});

test("calls onSelectUser when the Edit button is clicked", async () => {
  render(
    <UserList
      users={[adminUser]}
      selectedId={null}
      roleFilter="all"
      onSelectUser={onSelectUser}
      onRoleFilterChange={onRoleFilterChange}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Edit" }));

  expect(onSelectUser).toHaveBeenCalledWith(adminUser);
});

test("shows account count when user has accounts", () => {
  render(
    <UserList
      users={[adminUser]}
      selectedId={null}
      roleFilter="all"
      onSelectUser={onSelectUser}
      onRoleFilterChange={onRoleFilterChange}
    />,
  );

  expect(screen.getByText("1")).toBeInTheDocument();
});

test("shows dash when user has no accounts", () => {
  render(
    <UserList
      users={[staffUser]}
      selectedId={null}
      roleFilter="all"
      onSelectUser={onSelectUser}
      onRoleFilterChange={onRoleFilterChange}
    />,
  );

  expect(screen.getByText("—")).toBeInTheDocument();
});

test("shows Active badge for active users", () => {
  render(
    <UserList
      users={[adminUser]}
      selectedId={null}
      roleFilter="all"
      onSelectUser={onSelectUser}
      onRoleFilterChange={onRoleFilterChange}
    />,
  );

  expect(screen.getByText("Active")).toBeInTheDocument();
});

test("shows Inactive badge for inactive users", () => {
  render(
    <UserList
      users={[staffUser]}
      selectedId={null}
      roleFilter="all"
      onSelectUser={onSelectUser}
      onRoleFilterChange={onRoleFilterChange}
    />,
  );

  expect(screen.getByText("Inactive")).toBeInTheDocument();
});
