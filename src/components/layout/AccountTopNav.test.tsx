import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountTopNav } from "./AccountTopNav";

const onSignOut = vi.fn();

const navLinks = [
  { label: "Orders", to: "/accounts/abc" },
  { label: "Browse", to: "/browse" },
];

function renderWithRouter(ui: React.ReactNode, { initialPath = "/" } = {}) {
  const rootRoute = createRootRoute({ component: () => ui });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  return render(<RouterProvider router={router} />);
}

function renderNav(overrides?: Partial<React.ComponentProps<typeof AccountTopNav>>) {
  return renderWithRouter(
    <AccountTopNav
      email="sarah@bwow.com.au"
      accountId="abc"
      hasMultipleAccounts={false}
      navLinks={navLinks}
      onSignOut={onSignOut}
      {...overrides}
    />,
  );
}

test("renders company name", async () => {
  renderNav();
  expect(await screen.findByText("Boutique Wines of the World")).toBeInTheDocument();
});

test("renders all nav links", async () => {
  renderNav();
  expect(await screen.findByRole("link", { name: "Orders" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Browse" })).toBeInTheDocument();
});

test("renders accessible trigger for account menu", async () => {
  renderNav();
  expect(await screen.findByRole("button", { name: "Open account menu" })).toBeInTheDocument();
});

test("does not show Change account when hasMultipleAccounts is false", async () => {
  const user = userEvent.setup();
  renderNav({ hasMultipleAccounts: false });

  await user.click(await screen.findByRole("button", { name: "Open account menu" }));

  expect(screen.queryByRole("menuitem", { name: "Change account" })).not.toBeInTheDocument();
  expect(screen.getByRole("menuitem", { name: "Sign out" })).toBeInTheDocument();
});

test("shows Change account when hasMultipleAccounts is true", async () => {
  const user = userEvent.setup();
  renderNav({ hasMultipleAccounts: true });

  await user.click(await screen.findByRole("button", { name: "Open account menu" }));

  expect(await screen.findByRole("menuitem", { name: "Change account" })).toBeInTheDocument();
  expect(screen.getByRole("menuitem", { name: "Sign out" })).toBeInTheDocument();
});

test("calls onSignOut when Sign out is clicked", async () => {
  const user = userEvent.setup();
  renderNav();

  await user.click(await screen.findByRole("button", { name: "Open account menu" }));
  await user.click(await screen.findByRole("menuitem", { name: "Sign out" }));

  expect(onSignOut).toHaveBeenCalledTimes(1);
});
