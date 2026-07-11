import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { makeAccount } from "@/test/fixtures/accountFixtures";
import { AccountEditPanel } from "./AccountEditPanel";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/accounts/accounts.functions", () => ({
  listAccountUsers: vi.fn().mockResolvedValue({ ok: true, value: [] }),
  assignUserToAccount: vi.fn(),
  unassignUserFromAccount: vi.fn(),
}));
vi.mock("@/lib/users/users.functions", () => ({
  listUsers: vi.fn().mockResolvedValue({ ok: true, value: [] }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const baseAccount = makeAccount({
  id: "acc-1",
  name: "Acme Corp",
  contactName: "Jane Doe",
  contactEmail: "jane@acme.com",
  contactPhone: "0412345678",
  deliveryAddress: "1 Main St",
  deliveryInstructions: "Leave at door",
});

const onSave = vi.fn();
const onDiscard = vi.fn();

let user: UserEvent;

beforeEach(() => {
  user = userEvent.setup();
});

test("renders account name as heading", () => {
  render(<AccountEditPanel account={baseAccount} onSave={onSave} onDiscard={onDiscard} />, {
    wrapper,
  });

  expect(screen.getByRole("heading", { name: "Acme Corp" })).toBeInTheDocument();
});

test("pre-fills all fields from account", () => {
  render(<AccountEditPanel account={baseAccount} onSave={onSave} onDiscard={onDiscard} />, {
    wrapper,
  });

  expect(screen.getByLabelText("Account name")).toHaveValue("Acme Corp");
  expect(screen.getByLabelText("Contact name")).toHaveValue("Jane Doe");
  expect(screen.getByLabelText("Email")).toHaveValue("jane@acme.com");
  expect(screen.getByLabelText("Phone")).toHaveValue("0412345678");
  expect(screen.getByLabelText("Delivery address")).toHaveValue("1 Main St");
  expect(screen.getByLabelText("Delivery instructions")).toHaveValue("Leave at door");
});

test("shows validation error when account name is cleared on submit", async () => {
  render(<AccountEditPanel account={baseAccount} onSave={onSave} onDiscard={onDiscard} />, {
    wrapper,
  });

  await user.clear(screen.getByLabelText("Account name"));
  await user.click(screen.getByRole("button", { name: "Save changes" }));

  expect(await screen.findByText("Account name is required")).toBeInTheDocument();
  expect(onSave).not.toHaveBeenCalled();
});

test("shows validation error when contact email is invalid", async () => {
  render(<AccountEditPanel account={baseAccount} onSave={onSave} onDiscard={onDiscard} />, {
    wrapper,
  });

  await user.clear(screen.getByLabelText("Email"));
  await user.type(screen.getByLabelText("Email"), "not-an-email");
  await user.click(screen.getByRole("button", { name: "Save changes" }));

  expect(await screen.findByText("Must be a valid email address")).toBeInTheDocument();
  expect(onSave).not.toHaveBeenCalled();
});

test("calls onSave with updated values on valid submit", async () => {
  render(<AccountEditPanel account={baseAccount} onSave={onSave} onDiscard={onDiscard} />, {
    wrapper,
  });

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
        contactName: null,
        contactEmail: null,
        contactPhone: null,
      }}
      onSave={onSave}
      onDiscard={onDiscard}
    />,
    { wrapper },
  );

  await user.click(screen.getByRole("button", { name: "Save changes" }));

  await vi.waitFor(() => {
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        contactName: null,
        contactEmail: null,
        contactPhone: null,
      }),
    );
  });
});

test("disables the button and shows Saving… while onSave is pending", async () => {
  let resolveSave: () => void = () => {};
  const pendingSave = vi.fn(() => new Promise<void>((resolve) => (resolveSave = resolve)));

  render(<AccountEditPanel account={baseAccount} onSave={pendingSave} onDiscard={onDiscard} />, {
    wrapper,
  });

  await user.click(screen.getByRole("button", { name: "Save changes" }));

  const savingButton = await screen.findByRole("button", { name: "Saving…" });
  expect(savingButton).toBeDisabled();

  resolveSave();

  expect(await screen.findByRole("button", { name: "Save changes" })).toBeEnabled();
});

test("read-only mode hides Save changes button", () => {
  render(
    <AccountEditPanel account={baseAccount} readOnly onSave={onSave} onDiscard={onDiscard} />,
    { wrapper },
  );

  expect(screen.queryByRole("button", { name: "Save changes" })).not.toBeInTheDocument();
});

test("read-only mode shows Close button instead of Discard", () => {
  render(
    <AccountEditPanel account={baseAccount} readOnly onSave={onSave} onDiscard={onDiscard} />,
    { wrapper },
  );

  expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Discard" })).not.toBeInTheDocument();
});

test("read-only mode disables all inputs", () => {
  render(
    <AccountEditPanel account={baseAccount} readOnly onSave={onSave} onDiscard={onDiscard} />,
    { wrapper },
  );

  expect(screen.getByLabelText("Account name")).toBeDisabled();
  expect(screen.getByLabelText("Contact name")).toBeDisabled();
  expect(screen.getByLabelText("Email")).toBeDisabled();
  expect(screen.getByLabelText("Phone")).toBeDisabled();
  expect(screen.getByLabelText("Delivery address")).toBeDisabled();
  expect(screen.getByLabelText("Delivery instructions")).toBeDisabled();
});

test("calls onDiscard when Discard button is clicked", async () => {
  render(<AccountEditPanel account={baseAccount} onSave={onSave} onDiscard={onDiscard} />, {
    wrapper,
  });

  await user.click(screen.getByRole("button", { name: "Discard" }));

  expect(onDiscard).toHaveBeenCalled();
});

test("calls onDiscard when Close button is clicked in read-only mode", async () => {
  render(
    <AccountEditPanel account={baseAccount} readOnly onSave={onSave} onDiscard={onDiscard} />,
    { wrapper },
  );

  await user.click(screen.getByRole("button", { name: "Close" }));

  expect(onDiscard).toHaveBeenCalled();
});
