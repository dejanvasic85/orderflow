import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { OrderSuccessView } from "./OrderSuccessView";

function renderView(accountId: string, orderNumber: number) {
  const rootRoute = createRootRoute({
    component: () => <OrderSuccessView accountId={accountId} orderNumber={orderNumber} />,
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(<RouterProvider router={router} />);
}

test("renders Order submitted heading", async () => {
  renderView("acct-1", 1);

  expect(await screen.findByRole("heading", { name: "Order submitted" })).toBeInTheDocument();
});

test("renders formatted order reference", async () => {
  renderView("acct-1", 42);

  expect(await screen.findByText("ORD-0042")).toBeInTheDocument();
});

test("renders confirmation message", async () => {
  renderView("acct-1", 1);

  expect(
    await screen.findByText("Your order has been received and is being processed."),
  ).toBeInTheDocument();
});

test("renders Back to orders link pointing to the account page", async () => {
  renderView("acct-abc", 1);

  const link = await screen.findByRole("link", { name: "Back to orders" });
  expect(link).toBeInTheDocument();
  expect(link).toHaveAttribute("href", "/accounts/acct-abc");
});
