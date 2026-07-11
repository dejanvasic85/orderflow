import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import {
  listAccountUsers,
  assignUserToAccount,
  unassignUserFromAccount,
} from "@/lib/accounts/accounts.functions";
import { listUsers } from "@/lib/users/users.functions";
import { makeAccountUser } from "@/test/fixtures/accountFixtures";
import { makeUser } from "@/test/fixtures/userFixtures";
import { AccountUserSection } from "./AccountUserSection";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/accounts/accounts.functions", () => ({
  listAccountUsers: vi.fn(),
  assignUserToAccount: vi.fn(),
  unassignUserFromAccount: vi.fn(),
}));
vi.mock("@/lib/users/users.functions", () => ({
  listUsers: vi.fn(),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

let user: UserEvent;

beforeEach(() => {
  user = userEvent.setup();
  vi.mocked(listAccountUsers).mockResolvedValue({ ok: true, value: [] });
  vi.mocked(listUsers).mockResolvedValue({ ok: true, value: { users: [], total: 0 } });
  vi.mocked(assignUserToAccount).mockResolvedValue({ ok: true, value: undefined });
  vi.mocked(unassignUserFromAccount).mockResolvedValue({ ok: true, value: undefined });
});

test("shows skeleton while loading", () => {
  vi.mocked(listAccountUsers).mockReturnValue(new Promise(() => {}));
  vi.mocked(listUsers).mockReturnValue(new Promise(() => {}));

  render(<AccountUserSection accountId="acc-1" />, { wrapper });

  expect(screen.queryByText("Members")).not.toBeInTheDocument();
});

test("shows empty state when no users are assigned", async () => {
  render(<AccountUserSection accountId="acc-1" />, { wrapper });

  expect(await screen.findByText("No users assigned to this account yet.")).toBeInTheDocument();
});

test("renders assigned users with name and email", async () => {
  vi.mocked(listAccountUsers).mockResolvedValue({
    ok: true,
    value: [makeAccountUser()],
  });

  render(<AccountUserSection accountId="acc-1" />, { wrapper });

  expect(await screen.findByText("Alice Smith")).toBeInTheDocument();
  expect(screen.getByText("alice@example.com")).toBeInTheDocument();
});

test("renders member count badge", async () => {
  vi.mocked(listAccountUsers).mockResolvedValue({
    ok: true,
    value: [
      makeAccountUser({ userId: "u-1" }),
      makeAccountUser({
        userId: "u-2",
        user: { id: "u-2", name: "Bob Jones", email: null, role: "user" },
      }),
    ],
  });

  render(<AccountUserSection accountId="acc-1" />, { wrapper });

  expect(await screen.findByText("2")).toBeInTheDocument();
});

test("Add user button is disabled when all users are already assigned", async () => {
  vi.mocked(listAccountUsers).mockResolvedValue({
    ok: true,
    value: [makeAccountUser({ userId: "u-1" })],
  });
  vi.mocked(listUsers).mockResolvedValue({
    ok: true,
    value: { users: [makeUser({ id: "u-1" })], total: 1 },
  });

  render(<AccountUserSection accountId="acc-1" />, { wrapper });

  const button = await screen.findByRole("button", { name: "Add user" });
  expect(button).toBeDisabled();
});

test("Add user button is enabled when unassigned users exist", async () => {
  vi.mocked(listUsers).mockResolvedValue({
    ok: true,
    value: { users: [makeUser({ id: "u-2", name: "Bob Jones" })], total: 1 },
  });

  render(<AccountUserSection accountId="acc-1" />, { wrapper });

  const button = await screen.findByRole("button", { name: "Add user" });
  expect(button).toBeEnabled();
});

test("hides Add user button in read-only mode", async () => {
  render(<AccountUserSection accountId="acc-1" readOnly />, { wrapper });

  await screen.findByText("No users assigned to this account yet.");
  expect(screen.queryByRole("button", { name: "Add user" })).not.toBeInTheDocument();
});

test("hides remove button in read-only mode", async () => {
  vi.mocked(listAccountUsers).mockResolvedValue({
    ok: true,
    value: [makeAccountUser()],
  });

  render(<AccountUserSection accountId="acc-1" readOnly />, { wrapper });

  await screen.findByText("Alice Smith");
  expect(screen.queryByRole("button", { name: "Remove Alice Smith" })).not.toBeInTheDocument();
});

test("calls unassignUserFromAccount when remove button is clicked", async () => {
  vi.mocked(listAccountUsers).mockResolvedValue({
    ok: true,
    value: [makeAccountUser({ userId: "u-1" })],
  });

  render(<AccountUserSection accountId="acc-1" />, { wrapper });

  await user.click(await screen.findByRole("button", { name: "Remove Alice Smith" }));

  await vi.waitFor(() => {
    expect(vi.mocked(unassignUserFromAccount)).toHaveBeenCalledWith({
      data: { accountId: "acc-1", userId: "u-1" },
    });
  });
});

test("calls onUserCountChange after a user is removed", async () => {
  const onUserCountChange = vi.fn();

  vi.mocked(listAccountUsers)
    .mockResolvedValueOnce({ ok: true, value: [makeAccountUser({ userId: "u-1" })] })
    .mockResolvedValueOnce({ ok: true, value: [] });

  render(<AccountUserSection accountId="acc-1" onUserCountChange={onUserCountChange} />, {
    wrapper,
  });

  await user.click(await screen.findByRole("button", { name: "Remove Alice Smith" }));

  await vi.waitFor(() => {
    expect(onUserCountChange).toHaveBeenCalledWith(0);
  });
});
