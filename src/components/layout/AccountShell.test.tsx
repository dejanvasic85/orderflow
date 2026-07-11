import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountShell } from "./AccountShell";

const onSignOut = vi.fn();

function renderWithRouter(ui: React.ReactNode) {
  const rootRoute = createRootRoute({ component: () => ui });
  const router = createRouter({ routeTree: rootRoute, history: createMemoryHistory() });
  return render(<RouterProvider router={router} />);
}

function renderShell(overrides?: Partial<React.ComponentProps<typeof AccountShell>>) {
  return renderWithRouter(
    <AccountShell
      email="tom@bwow.com.au"
      accountId="abc123"
      hasMultipleAccounts={false}
      onSignOut={onSignOut}
      {...overrides}
    >
      <div>Page content</div>
    </AccountShell>,
  );
}

describe("AccountShell", () => {
  test("renders children", async () => {
    renderShell();
    expect(await screen.findByText("Page content")).toBeInTheDocument();
  });

  test("renders Orders link pointing to the account in the top nav", async () => {
    renderShell({ accountId: "abc123" });
    const header = await screen.findByRole("banner");
    expect(header.querySelector('a[href="/accounts/abc123"]')).toBeInTheDocument();
  });

  test("renders Browse nav link in the top nav", async () => {
    renderShell();
    const header = await screen.findByRole("banner");
    expect(header.querySelector('a[href="/accounts/abc123/browse"]')).toBeInTheDocument();
  });

  test("renders a New Order mobile tab pointing to the account's new order route", async () => {
    renderShell({ accountId: "abc123" });

    const link = await screen.findByRole("link", { name: /new order/i });
    expect(link).toHaveAttribute("href", "/accounts/abc123/orders/new");
  });

  test("New Order tab falls back to the account picker when no account is active", async () => {
    renderShell({ accountId: "" });

    const link = await screen.findByRole("link", { name: /new order/i });
    expect(link).toHaveAttribute("href", "/accounts");
  });

  test("calls onSignOut when Sign out is clicked", async () => {
    const user = userEvent.setup();
    renderShell();

    const menuButtons = await screen.findAllByRole("button", { name: "Open account menu" });
    await user.click(menuButtons[0]);
    await user.click(await screen.findByRole("menuitem", { name: "Sign out" }));

    expect(onSignOut).toHaveBeenCalledTimes(1);
  });
});
