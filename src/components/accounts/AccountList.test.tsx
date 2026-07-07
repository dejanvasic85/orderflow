import { act, render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import type { Account } from "@/lib/accounts/schema";
import { AccountList } from "./AccountList";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    params,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
    params?: Record<string, string>;
    onClick?: React.MouseEventHandler;
  }) => {
    const href = params
      ? Object.entries(params).reduce((acc, [k, v]) => acc.replace(`$${k}`, v), to)
      : to;
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));

const account: Account = {
  id: "acc-1",
  name: "Acme Corp",
  contactName: "Jane Doe",
  contactEmail: "jane@acme.com",
  contactPhone: "0412345678",
  deliveryAddress: "1 Main St",
  deliveryInstructions: "Leave at door",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  userCount: 3,
};

const accountWithNullContacts: Account = {
  id: "acc-2",
  name: "Defunct Inc",
  contactName: null,
  contactEmail: null,
  contactPhone: null,
  deliveryAddress: null,
  deliveryInstructions: null,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  userCount: 0,
};

const defaultProps = {
  total: 2,
  selectedId: null as string | null,
  searchQuery: "",
  isLoading: false,
  currentPage: 1,
  totalPages: 1,
  onSelectAccount: vi.fn(),
  onSearchChange: vi.fn(),
  onPageChange: vi.fn(),
};

let user: UserEvent;

beforeEach(() => {
  user = userEvent.setup();
});

test("renders account name in the table", () => {
  render(<AccountList {...defaultProps} accounts={[account]} />);

  expect(screen.getByText("Acme Corp")).toBeInTheDocument();
});

test("renders contact name, email and phone when present", () => {
  render(<AccountList {...defaultProps} accounts={[account]} />);

  expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  expect(screen.getByText("jane@acme.com")).toBeInTheDocument();
  expect(screen.getByText("0412345678")).toBeInTheDocument();
});

test("renders dashes when contact fields are null", () => {
  render(<AccountList {...defaultProps} accounts={[accountWithNullContacts]} />);

  expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(3);
});

test("renders user count when greater than zero", () => {
  render(<AccountList {...defaultProps} accounts={[account]} />);

  expect(screen.getByText("3")).toBeInTheDocument();
});

test("renders dash for user count when zero", () => {
  render(<AccountList {...defaultProps} accounts={[accountWithNullContacts]} />);

  expect(screen.getAllByText("—")).toHaveLength(4);
});

test("calls onSelectAccount when a row is clicked", async () => {
  const onSelectAccount = vi.fn();

  render(<AccountList {...defaultProps} accounts={[account]} onSelectAccount={onSelectAccount} />);

  await user.click(screen.getByText("Acme Corp"));

  expect(onSelectAccount).toHaveBeenCalledWith(account);
});

test("calls onSelectAccount when Edit is selected from the dropdown", async () => {
  const onSelectAccount = vi.fn();

  render(<AccountList {...defaultProps} accounts={[account]} onSelectAccount={onSelectAccount} />);

  await user.click(screen.getByRole("button", { name: "Account actions" }));
  await user.click(screen.getByRole("menuitem", { name: /edit/i }));

  expect(onSelectAccount).toHaveBeenCalledWith(account);
});

test("renders multiple accounts", () => {
  render(<AccountList {...defaultProps} accounts={[account, accountWithNullContacts]} />);

  expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  expect(screen.getByText("Defunct Inc")).toBeInTheDocument();
});

test("dropdown contains Template, Users and Place order links for the account", async () => {
  render(<AccountList {...defaultProps} accounts={[account]} />);

  await user.click(screen.getByRole("button", { name: "Account actions" }));

  expect(screen.getByRole("menuitem", { name: /template/i })).toBeInTheDocument();
  expect(screen.getByRole("menuitem", { name: /users/i })).toBeInTheDocument();
  expect(screen.getByRole("menuitem", { name: /place order/i })).toBeInTheDocument();
});

test("calls onSearchChange after 300ms debounce when user types", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  const debouncedUser = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
  const onSearchChange = vi.fn();

  render(<AccountList {...defaultProps} accounts={[account]} onSearchChange={onSearchChange} />);

  const input = screen.getByRole("textbox", { name: "Search accounts" });
  await debouncedUser.type(input, "Acme");

  await act(async () => {
    vi.runAllTimers();
  });

  expect(onSearchChange).toHaveBeenCalledWith("Acme");

  vi.useRealTimers();
});

test("does not call onSearchChange on mount when input matches the search query", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  const onSearchChange = vi.fn();

  render(
    <AccountList
      {...defaultProps}
      accounts={[account]}
      searchQuery="Acme"
      onSearchChange={onSearchChange}
    />,
  );

  await act(async () => {
    vi.runAllTimers();
  });

  expect(onSearchChange).not.toHaveBeenCalled();

  vi.useRealTimers();
});

test("shows empty state message when no accounts and no search query", () => {
  render(<AccountList {...defaultProps} accounts={[]} searchQuery="" />);

  expect(screen.getByText("No accounts found")).toBeInTheDocument();
});

test("shows no match message when no accounts and search query is set", () => {
  render(<AccountList {...defaultProps} accounts={[]} searchQuery="xyz" />);

  expect(screen.getByText("No accounts match your search")).toBeInTheDocument();
});

test("shows loading skeletons and hides rows when isLoading is true", () => {
  render(<AccountList {...defaultProps} accounts={[account]} isLoading />);

  expect(screen.queryByText("Acme Corp")).not.toBeInTheDocument();
});

test("shows pagination controls when totalPages is greater than 1", () => {
  render(<AccountList {...defaultProps} accounts={[account]} currentPage={1} totalPages={3} />);

  expect(screen.getByRole("button", { name: "Previous" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
  expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
});

test("hides pagination controls when totalPages is 1", () => {
  render(<AccountList {...defaultProps} accounts={[account]} currentPage={1} totalPages={1} />);

  expect(screen.queryByRole("button", { name: "Previous" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
});

test("calls onPageChange with next page when Next is clicked", async () => {
  const onPageChange = vi.fn();

  render(
    <AccountList
      {...defaultProps}
      accounts={[account]}
      currentPage={1}
      totalPages={3}
      onPageChange={onPageChange}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Next" }));

  expect(onPageChange).toHaveBeenCalledWith(2);
});

test("calls onPageChange with previous page when Previous is clicked", async () => {
  const onPageChange = vi.fn();

  render(
    <AccountList
      {...defaultProps}
      accounts={[account]}
      currentPage={2}
      totalPages={3}
      onPageChange={onPageChange}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Previous" }));

  expect(onPageChange).toHaveBeenCalledWith(1);
});
