import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { DefaultCatchBoundary } from "./DefaultCatchBoundary";

function renderBoundary(error: Error) {
  const rootRoute = createRootRoute({
    component: () => (
      <DefaultCatchBoundary error={error} reset={() => {}} info={{ componentStack: "" }} />
    ),
  });
  const router = createRouter({ routeTree: rootRoute, history: createMemoryHistory() });
  return render(<RouterProvider router={router} />);
}

describe("DefaultCatchBoundary", () => {
  test("shows a friendly message as the heading", async () => {
    renderBoundary(new Error("PGRST116: relation does not exist"));

    const heading = await screen.findByText("Something went wrong");
    expect(heading).toBeInTheDocument();
    expect(screen.getByText(/We hit an unexpected problem loading this page/)).toBeInTheDocument();
  });

  test("offers a Try again action", async () => {
    renderBoundary(new Error("boom"));
    expect(await screen.findByRole("button", { name: /Try again/ })).toBeInTheDocument();
  });

  test("renders a Go home link pointing to the root", async () => {
    renderBoundary(new Error("boom"));
    const link = await screen.findByRole("link", { name: "Go home" });
    expect(link).toHaveAttribute("href", "/");
  });
});
