import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminShell } from "./AdminShell";

const onSignOut = vi.fn();

function renderWithRouter(ui: React.ReactNode) {
  const rootRoute = createRootRoute({ component: () => ui });
  const router = createRouter({ routeTree: rootRoute, history: createMemoryHistory() });
  return render(<RouterProvider router={router} />);
}

function renderShell(overrides?: Partial<React.ComponentProps<typeof AdminShell>>) {
  return renderWithRouter(
    <TooltipProvider>
      <AdminShell email="admin@bwow.com.au" onSignOut={onSignOut} {...overrides}>
        <div>Admin content</div>
      </AdminShell>
    </TooltipProvider>,
  );
}

test("renders children", async () => {
  renderShell();
  expect(await screen.findByText("Admin content")).toBeInTheDocument();
});

test("renders Orders and Users nav links", async () => {
  renderShell();
  const ordersLinks = await screen.findAllByRole("link", { name: /orders/i });
  expect(ordersLinks.length).toBeGreaterThan(0);
  const usersLinks = screen.getAllByRole("link", { name: /users/i });
  expect(usersLinks.length).toBeGreaterThan(0);
});

test("calls onSignOut when Sign out is clicked", async () => {
  const user = userEvent.setup();
  renderShell();

  await user.click(await screen.findByText("admin@bwow.com.au"));
  await user.click(await screen.findByRole("menuitem", { name: "Sign out" }));

  expect(onSignOut).toHaveBeenCalledTimes(1);
});
