import { render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import type { AccountRow } from "@/lib/accounts/schema";
import { AccountList } from "./AccountList";

const account: AccountRow = {
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

const accountWithNullContacts: AccountRow = {
  id: "acc-2",
  name: "Defunct Inc",
  contact_name: null,
  contact_email: null,
  contact_phone: null,
  delivery_address: null,
  delivery_instructions: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const onSelectAccount = vi.fn();

let user: UserEvent;

beforeEach(() => {
  user = userEvent.setup();
});

test("renders account name in the table", () => {
  render(<AccountList accounts={[account]} selectedId={null} onSelectAccount={onSelectAccount} />);

  expect(screen.getByText("Acme Corp")).toBeInTheDocument();
});

test("renders contact name, email and phone when present", () => {
  render(<AccountList accounts={[account]} selectedId={null} onSelectAccount={onSelectAccount} />);

  expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  expect(screen.getByText("jane@acme.com")).toBeInTheDocument();
  expect(screen.getByText("0412345678")).toBeInTheDocument();
});

test("renders dashes when contact fields are null", () => {
  render(
    <AccountList
      accounts={[accountWithNullContacts]}
      selectedId={null}
      onSelectAccount={onSelectAccount}
    />,
  );

  expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(3);
});

test("calls onSelectAccount when a row is clicked", async () => {
  render(<AccountList accounts={[account]} selectedId={null} onSelectAccount={onSelectAccount} />);

  await user.click(screen.getByText("Acme Corp"));

  expect(onSelectAccount).toHaveBeenCalledWith(account);
});

test("calls onSelectAccount when the Edit button is clicked", async () => {
  render(<AccountList accounts={[account]} selectedId={null} onSelectAccount={onSelectAccount} />);

  await user.click(screen.getByRole("button", { name: "Edit" }));

  expect(onSelectAccount).toHaveBeenCalledWith(account);
});

test("renders multiple accounts", () => {
  render(
    <AccountList
      accounts={[account, accountWithNullContacts]}
      selectedId={null}
      onSelectAccount={onSelectAccount}
    />,
  );

  expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  expect(screen.getByText("Defunct Inc")).toBeInTheDocument();
});
