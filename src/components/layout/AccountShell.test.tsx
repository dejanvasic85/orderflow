import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountShell } from "./AccountShell";

vi.mock("@/lib/supabase", () => ({
  supabase: { auth: { signOut: vi.fn().mockResolvedValue({}) } },
}));

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
      {...overrides}
    >
      <div>Page content</div>
    </AccountShell>,
  );
}

test("renders children", async () => {
  renderShell();
  expect(await screen.findByText("Page content")).toBeInTheDocument();
});

test("renders Orders link pointing to the account in the top nav", async () => {
  renderShell({ accountId: "abc123" });
  // Both desktop and mobile nav render — query the header specifically
  const header = await screen.findByRole("banner");
  expect(header.querySelector('a[href="/accounts/abc123"]')).toBeInTheDocument();
});

test("renders Browse nav link in the top nav", async () => {
  renderShell();
  const header = await screen.findByRole("banner");
  expect(header.querySelector('a[href="/browse"]')).toBeInTheDocument();
});

test("sign out calls supabase signOut", async () => {
  const user = userEvent.setup();
  const { supabase } = await import("@/lib/supabase");
  renderShell();

  // Use the desktop nav button (first one)
  const menuButtons = await screen.findAllByRole("button", { name: "Open account menu" });
  await user.click(menuButtons[0]);
  await user.click(await screen.findByRole("menuitem", { name: "Sign out" }));

  expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
});
