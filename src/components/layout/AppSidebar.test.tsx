import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "./AppSidebar";

const onSignOut = vi.fn();

function renderWithRouter(ui: React.ReactNode) {
  const rootRoute = createRootRoute({ component: () => ui });
  const router = createRouter({ routeTree: rootRoute, history: createMemoryHistory() });
  return render(<RouterProvider router={router} />);
}

function renderSidebar(overrides?: Partial<React.ComponentProps<typeof AppSidebar>>) {
  return renderWithRouter(
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar email="admin@bwow.com.au" onSignOut={onSignOut} {...overrides} />
      </SidebarProvider>
    </TooltipProvider>,
  );
}

test("renders company name", async () => {
  renderSidebar();
  expect(await screen.findByText("Boutique Wines of the World")).toBeInTheDocument();
});

test("renders Orders and Users nav links", async () => {
  renderSidebar();
  expect(await screen.findByRole("link", { name: /orders/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /users/i })).toBeInTheDocument();
});

test("renders user email in footer", async () => {
  renderSidebar();
  expect(await screen.findByText("admin@bwow.com.au")).toBeInTheDocument();
});

test("calls onSignOut when Sign out is clicked", async () => {
  const user = userEvent.setup();
  renderSidebar();

  await user.click(await screen.findByText("admin@bwow.com.au"));
  await user.click(await screen.findByRole("menuitem", { name: "Sign out" }));

  expect(onSignOut).toHaveBeenCalledTimes(1);
});
