import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { NotFound } from "./NotFound";

function renderWithRouter(ui: React.ReactNode) {
  const rootRoute = createRootRoute({ component: () => ui });
  const router = createRouter({ routeTree: rootRoute, history: createMemoryHistory() });
  return render(<RouterProvider router={router} />);
}

describe("NotFound", () => {
  test("shows a friendly page not found heading", async () => {
    renderWithRouter(<NotFound />);
    expect(await screen.findByText("Page not found")).toBeInTheDocument();
  });

  test("renders a Go home link pointing to the root", async () => {
    renderWithRouter(<NotFound />);
    const link = await screen.findByRole("link", { name: "Go home" });
    expect(link).toHaveAttribute("href", "/");
  });
});
