import { render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import type { AccountRow } from "@/lib/accounts/schema";
import { AccountEditPanel } from "./AccountEditPanel";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const baseAccount: AccountRow = {
  id: "acc-1",
  name: "Acme Corp",
  contact_name: "Jane Doe",
  contact_email: "jane@acme.com",
  contact_phone: "0412345678",
  delivery_address: "1 Main St",
  delivery_instructions: "Leave at door",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const onSave = vi.fn();
const onDiscard = vi.fn();

let user: UserEvent;

beforeEach(() => {
  user = userEvent.setup();
});

test("renders account name as heading", () => {
  render(<AccountEditPanel account={baseAccount} onSave={onSave} onDiscard={onDiscard} />);

  expect(screen.getByRole("heading", { name: "Acme Corp" })).toBeInTheDocument();
});

test("pre-fills all fields from account", () => {
  render(<AccountEditPanel account={baseAccount} onSave={onSave} onDiscard={onDiscard} />);

  expect(screen.getByLabelText("Account name")).toHaveValue("Acme Corp");
  expect(screen.getByLabelText("Contact name")).toHaveValue("Jane Doe");
  expect(screen.getByLabelText("Email")).toHaveValue("jane@acme.com");
  expect(screen.getByLabelText("Phone")).toHaveValue("0412345678");
  expect(screen.getByLabelText("Delivery address")).toHaveValue("1 Main St");
  expect(screen.getByLabelText("Delivery instructions")).toHaveValue("Leave at door");
});

test("shows validation error when account name is cleared on submit", async () => {
  render(<AccountEditPanel account={baseAccount} onSave={onSave} onDiscard={onDiscard} />);

  await user.clear(screen.getByLabelText("Account name"));
  await user.click(screen.getByRole("button", { name: "Save changes" }));

  expect(await screen.findByText("Account name is required")).toBeInTheDocument();
  expect(onSave).not.toHaveBeenCalled();
});

test("shows validation error when contact email is invalid", async () => {
  render(<AccountEditPanel account={baseAccount} onSave={onSave} onDiscard={onDiscard} />);

  await user.clear(screen.getByLabelText("Email"));
  await user.type(screen.getByLabelText("Email"), "not-an-email");
  await user.click(screen.getByRole("button", { name: "Save changes" }));

  expect(await screen.findByText("Must be a valid email address")).toBeInTheDocument();
  expect(onSave).not.toHaveBeenCalled();
});

test("calls onSave with updated values on valid submit", async () => {
  render(<AccountEditPanel account={baseAccount} onSave={onSave} onDiscard={onDiscard} />);

  await user.clear(screen.getByLabelText("Account name"));
  await user.type(screen.getByLabelText("Account name"), "New Name");
  await user.click(screen.getByRole("button", { name: "Save changes" }));

  await vi.waitFor(() => {
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: "New Name" }));
  });
});

test("calls onSave with null for empty optional fields", async () => {
  render(
    <AccountEditPanel
      account={{
        ...baseAccount,
        contact_name: null,
        contact_email: null,
        contact_phone: null,
      }}
      onSave={onSave}
      onDiscard={onDiscard}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Save changes" }));

  await vi.waitFor(() => {
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        contact_name: null,
        contact_email: null,
        contact_phone: null,
      }),
    );
  });
});

test("read-only mode hides Save changes button", () => {
  render(<AccountEditPanel account={baseAccount} readOnly onSave={onSave} onDiscard={onDiscard} />);

  expect(screen.queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument();
});

test("read-only mode shows Close button instead of Discard", () => {
  render(<AccountEditPanel account={baseAccount} readOnly onSave={onSave} onDiscard={onDiscard} />);

  expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Discard" })).not.toBeInTheDocument();
});

test("read-only mode disables all inputs", () => {
  render(<AccountEditPanel account={baseAccount} readOnly onSave={onSave} onDiscard={onDiscard} />);

  expect(screen.getByLabelText("Account name")).toBeDisabled();
  expect(screen.getByLabelText("Contact name")).toBeDisabled();
  expect(screen.getByLabelText("Email")).toBeDisabled();
  expect(screen.getByLabelText("Phone")).toBeDisabled();
  expect(screen.getByLabelText("Delivery address")).toBeDisabled();
  expect(screen.getByLabelText("Delivery instructions")).toBeDisabled();
});

test("calls onDiscard when Discard button is clicked", async () => {
  render(<AccountEditPanel account={baseAccount} onSave={onSave} onDiscard={onDiscard} />);

  await user.click(screen.getByRole("button", { name: "Discard" }));

  expect(onDiscard).toHaveBeenCalled();
});

test("calls onDiscard when Close button is clicked in read-only mode", async () => {
  render(<AccountEditPanel account={baseAccount} readOnly onSave={onSave} onDiscard={onDiscard} />);

  await user.click(screen.getByRole("button", { name: "Close" }));

  expect(onDiscard).toHaveBeenCalled();
});
