import { render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import type { User } from "@/lib/users/schema";
import { UserEditPanel } from "./UserEditPanel";

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

const baseUser: User = {
  id: "u-1",
  name: "Alice Smith",
  email: "alice@example.com",
  phone: null,
  active: true,
  invite_accepted_at: "2024-01-02T00:00:00Z",
  role: "staff",
  notification_preferences: { email: true, sms: false },
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  accounts: [{ id: "acc-1", name: "Acme" }],
};

const availableAccounts = [
  { id: "acc-1", name: "Acme" },
  { id: "acc-2", name: "Globex" },
];

const onSave = vi.fn();
const onDiscard = vi.fn();

let user: UserEvent;

beforeEach(() => {
  user = userEvent.setup();
});

test("renders user name and email as header", () => {
  render(
    <UserEditPanel
      user={baseUser}
      availableAccounts={availableAccounts}
      onSave={onSave}
      onDiscard={onDiscard}
    />,
  );

  expect(screen.getByRole("heading", { name: "Alice Smith" })).toBeInTheDocument();
  expect(screen.getByText("alice@example.com")).toBeInTheDocument();
});

test("pre-fills first name and last name from user.name", () => {
  render(
    <UserEditPanel
      user={baseUser}
      availableAccounts={availableAccounts}
      onSave={onSave}
      onDiscard={onDiscard}
    />,
  );

  expect(screen.getByLabelText("First name")).toHaveValue("Alice");
  expect(screen.getByLabelText("Last name")).toHaveValue("Smith");
});

test("shows validation errors when first and last name are cleared on submit", async () => {
  render(
    <UserEditPanel
      user={baseUser}
      availableAccounts={availableAccounts}
      onSave={onSave}
      onDiscard={onDiscard}
    />,
  );

  await user.clear(screen.getByLabelText("First name"));
  await user.clear(screen.getByLabelText("Last name"));
  await user.click(screen.getByRole("button", { name: "Save changes" }));

  expect(await screen.findByText("First name is required")).toBeInTheDocument();
  expect(screen.getByText("Last name is required")).toBeInTheDocument();
  expect(onSave).not.toHaveBeenCalled();
});

test("calls onSave with joined name on valid submit", async () => {
  render(
    <UserEditPanel
      user={baseUser}
      availableAccounts={availableAccounts}
      onSave={onSave}
      onDiscard={onDiscard}
    />,
  );

  await user.clear(screen.getByLabelText("First name"));
  await user.type(screen.getByLabelText("First name"), "Bob");
  await user.clear(screen.getByLabelText("Last name"));
  await user.type(screen.getByLabelText("Last name"), "Jones");
  await user.click(screen.getByRole("button", { name: "Save changes" }));

  await vi.waitFor(() => {
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: "Bob Jones" }));
  });
});

test("shows assigned account as a badge", () => {
  render(
    <UserEditPanel
      user={baseUser}
      availableAccounts={availableAccounts}
      onSave={onSave}
      onDiscard={onDiscard}
    />,
  );

  expect(screen.getByText("Acme")).toBeInTheDocument();
});

test("removes an assigned account when its remove button is clicked", async () => {
  render(
    <UserEditPanel
      user={baseUser}
      availableAccounts={availableAccounts}
      onSave={onSave}
      onDiscard={onDiscard}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Remove Acme" }));

  expect(screen.queryByRole("button", { name: "Remove Acme" })).not.toBeInTheDocument();
});

test("shows the add account trigger when unassigned accounts exist", () => {
  render(
    <UserEditPanel
      user={baseUser}
      availableAccounts={availableAccounts}
      onSave={onSave}
      onDiscard={onDiscard}
    />,
  );

  // Globex is unassigned so the add trigger should be visible
  expect(screen.getByText("Add an account...")).toBeInTheDocument();
});

test("hides the add account trigger when all accounts are already assigned", () => {
  render(
    <UserEditPanel
      user={{ ...baseUser, accounts: availableAccounts }}
      availableAccounts={availableAccounts}
      onSave={onSave}
      onDiscard={onDiscard}
    />,
  );

  expect(screen.queryByText("Add an account...")).not.toBeInTheDocument();
});

test("calls onDiscard when Discard button is clicked", async () => {
  render(
    <UserEditPanel
      user={baseUser}
      availableAccounts={availableAccounts}
      onSave={onSave}
      onDiscard={onDiscard}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Discard" }));

  expect(onDiscard).toHaveBeenCalled();
});

test("notification checkboxes reflect user preferences", () => {
  render(
    <UserEditPanel
      user={baseUser}
      availableAccounts={availableAccounts}
      onSave={onSave}
      onDiscard={onDiscard}
    />,
  );

  expect(screen.getByLabelText("Email notifications")).toBeChecked();
  expect(screen.getByLabelText("SMS notifications")).not.toBeChecked();
});

test("calls onSave with updated notification preferences", async () => {
  render(
    <UserEditPanel
      user={baseUser}
      availableAccounts={availableAccounts}
      onSave={onSave}
      onDiscard={onDiscard}
    />,
  );

  await user.click(screen.getByLabelText("SMS notifications"));
  await user.click(screen.getByRole("button", { name: "Save changes" }));

  await vi.waitFor(() => {
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        notification_preferences: { email: true, sms: true },
      }),
    );
  });
});

test("create mode shows invite header and send invite button", () => {
  render(
    <UserEditPanel
      mode="create"
      availableAccounts={availableAccounts}
      onSave={onSave}
      onDiscard={onDiscard}
    />,
  );

  expect(screen.getByRole("heading", { name: "Invite new user" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Send invite" })).toBeInTheDocument();
});

test("create mode enables the email input", () => {
  render(
    <UserEditPanel
      mode="create"
      availableAccounts={availableAccounts}
      onSave={onSave}
      onDiscard={onDiscard}
    />,
  );

  expect(screen.getByLabelText("Email")).toBeEnabled();
});

test("create mode rejects submit when email is not a valid address", async () => {
  render(
    <UserEditPanel
      mode="create"
      availableAccounts={availableAccounts}
      onSave={onSave}
      onDiscard={onDiscard}
    />,
  );

  await user.type(screen.getByLabelText("Email"), "not-an-email");
  await user.type(screen.getByLabelText("First name"), "Bob");
  await user.type(screen.getByLabelText("Last name"), "Jones");
  await user.click(screen.getByRole("button", { name: "Send invite" }));

  await vi.waitFor(() => {
    expect(onSave).not.toHaveBeenCalled();
  });
});

test("create mode submits with collected fields", async () => {
  render(
    <UserEditPanel
      mode="create"
      availableAccounts={availableAccounts}
      onSave={onSave}
      onDiscard={onDiscard}
    />,
  );

  await user.type(screen.getByLabelText("Email"), "new@example.com");
  await user.type(screen.getByLabelText("First name"), "Bob");
  await user.type(screen.getByLabelText("Last name"), "Jones");
  await user.click(screen.getByRole("button", { name: "Send invite" }));

  await vi.waitFor(() => {
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "new@example.com",
        name: "Bob Jones",
      }),
    );
  });
});

test("create mode shows error and blocks submit when email already exists", async () => {
  const onCheckEmailExists = vi.fn().mockResolvedValue(true);

  render(
    <UserEditPanel
      mode="create"
      availableAccounts={availableAccounts}
      onSave={onSave}
      onDiscard={onDiscard}
      onCheckEmailExists={onCheckEmailExists}
    />,
  );

  await user.type(screen.getByLabelText("Email"), "existing@example.com");
  await user.type(screen.getByLabelText("First name"), "Bob");
  await user.type(screen.getByLabelText("Last name"), "Jones");
  await user.click(screen.getByRole("button", { name: "Send invite" }));

  expect(await screen.findByText("A user with this email already exists")).toBeInTheDocument();
  expect(onSave).not.toHaveBeenCalled();
});

test("create mode shows fallback error and blocks submit when email check throws", async () => {
  const onCheckEmailExists = vi.fn().mockRejectedValue(new Error("network error"));

  render(
    <UserEditPanel
      mode="create"
      availableAccounts={availableAccounts}
      onSave={onSave}
      onDiscard={onDiscard}
      onCheckEmailExists={onCheckEmailExists}
    />,
  );

  await user.type(screen.getByLabelText("Email"), "new@example.com");
  await user.type(screen.getByLabelText("First name"), "Bob");
  await user.type(screen.getByLabelText("Last name"), "Jones");
  await user.click(screen.getByRole("button", { name: "Send invite" }));

  expect(
    await screen.findByText("Unable to verify this email right now. Please try again."),
  ).toBeInTheDocument();
  expect(onSave).not.toHaveBeenCalled();
});

test("create mode does not show duplicate error when email is available", async () => {
  const onCheckEmailExists = vi.fn().mockResolvedValue(false);

  render(
    <UserEditPanel
      mode="create"
      availableAccounts={availableAccounts}
      onSave={onSave}
      onDiscard={onDiscard}
      onCheckEmailExists={onCheckEmailExists}
    />,
  );

  await user.type(screen.getByLabelText("Email"), "new@example.com");
  await user.type(screen.getByLabelText("First name"), "Bob");
  await user.type(screen.getByLabelText("Last name"), "Jones");
  await user.click(screen.getByRole("button", { name: "Send invite" }));

  await vi.waitFor(() => {
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ email: "new@example.com" }));
  });
  expect(screen.queryByText("A user with this email already exists")).not.toBeInTheDocument();
});
