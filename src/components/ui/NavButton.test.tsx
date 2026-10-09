import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NavButton } from "@/components/ui/NavButton";

test("stays pending while the destination redirects to a route that is still loading", async () => {
  const user = userEvent.setup();
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <NavButton to="/login">Login</NavButton>,
  });
  const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/login",
    beforeLoad: () => {
      throw redirect({ to: "/accounts" });
    },
  });
  const accountsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/accounts",
    loader: () => new Promise<void>(() => {}),
    component: () => <h1>Accounts</h1>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([homeRoute, loginRoute, accountsRoute]),
    history: createMemoryHistory(),
  });
  render(<RouterProvider router={router} />);

  await user.click(await screen.findByRole("link", { name: "Login" }));

  await vi.waitFor(() => expect(router.state.location.pathname).toBe("/accounts"));
  expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute("aria-busy", "true");
});
