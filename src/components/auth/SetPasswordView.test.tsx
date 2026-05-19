import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { SetPasswordView } from "./SetPasswordView";

function renderWithRouter(ui: React.ReactNode) {
  const rootRoute = createRootRoute({ component: () => ui });
  const router = createRouter({ routeTree: rootRoute, history: createMemoryHistory() });
  return render(<RouterProvider router={router} />);
}

test("renders heading and description", async () => {
  renderWithRouter(<SetPasswordView onSetPassword={vi.fn()} />);

  expect(await screen.findByRole("heading", { name: "Set your password" })).toBeInTheDocument();
  expect(screen.getByText("Choose a password to complete your account setup.")).toBeInTheDocument();
});

test("renders the password form", async () => {
  renderWithRouter(<SetPasswordView onSetPassword={vi.fn()} />);

  await screen.findByRole("heading", { name: "Set your password" });
  expect(screen.getByLabelText("Password")).toBeInTheDocument();
  expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Set password" })).toBeInTheDocument();
});
