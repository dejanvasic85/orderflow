import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { AuthCallbackView } from "./AuthCallbackView";

function renderWithRouter(ui: React.ReactNode) {
  const rootRoute = createRootRoute({ component: () => ui });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory(),
  });
  return render(<RouterProvider router={router} />);
}

test("shows verifying state when error is null", async () => {
  renderWithRouter(<AuthCallbackView error={null} />);

  expect(await screen.findByRole("heading", { name: "Verifying…" })).toBeInTheDocument();
  expect(screen.getByText("Please wait while we verify your link.")).toBeInTheDocument();
});

test("shows error state with message and back to sign in link", async () => {
  renderWithRouter(
    <AuthCallbackView error="This invite link has already been used or has expired." />,
  );

  expect(await screen.findByRole("heading", { name: "Link invalid" })).toBeInTheDocument();
  expect(
    screen.getByText("This invite link has already been used or has expired."),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Back to sign in" })).toBeInTheDocument();
});

test("does not show back to sign in link when verifying", async () => {
  renderWithRouter(<AuthCallbackView error={null} />);

  await screen.findByRole("heading", { name: "Verifying…" });
  expect(screen.queryByRole("link", { name: "Back to sign in" })).not.toBeInTheDocument();
});
