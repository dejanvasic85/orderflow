import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountSelectionView } from "./AccountSelectionView";

const twoAccounts = [
  { id: "acc-1", name: "Acme Corp" },
  { id: "acc-2", name: "Globex" },
];

test("renders account buttons when accounts are provided", () => {
  render(
    <AccountSelectionView accounts={twoAccounts} onSelectAccount={vi.fn()} onSignOut={vi.fn()} />,
  );

  expect(screen.getByRole("button", { name: /acme corp/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /globex/i })).toBeInTheDocument();
});

test("calls onSelectAccount with the account id when an account button is clicked", async () => {
  const user = userEvent.setup();
  const handleSelect = vi.fn();

  render(
    <AccountSelectionView
      accounts={twoAccounts}
      onSelectAccount={handleSelect}
      onSignOut={vi.fn()}
    />,
  );

  await user.click(screen.getByRole("button", { name: /acme corp/i }));

  expect(handleSelect).toHaveBeenCalledWith("acc-1");
});

test("shows the empty state when no accounts are assigned", () => {
  render(<AccountSelectionView accounts={[]} onSelectAccount={vi.fn()} onSignOut={vi.fn()} />);

  expect(screen.getByText("No Account Assigned")).toBeInTheDocument();
  expect(screen.getByText(/contact your administrator/i)).toBeInTheDocument();
});

test("calls onSignOut when the sign out button is clicked", async () => {
  const user = userEvent.setup();
  const handleSignOut = vi.fn();

  render(
    <AccountSelectionView
      accounts={twoAccounts}
      onSelectAccount={vi.fn()}
      onSignOut={handleSignOut}
    />,
  );

  await user.click(screen.getByRole("button", { name: /sign out/i }));

  expect(handleSignOut).toHaveBeenCalledOnce();
});
