import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmView } from "./ConfirmView";

function renderWithRouter(ui: React.ReactNode) {
  const rootRoute = createRootRoute({ component: () => ui });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory(),
  });
  return render(<RouterProvider router={router} />);
}

test("shows a continue button when error is null", async () => {
  renderWithRouter(<ConfirmView error={null} submitting={false} onContinue={vi.fn()} />);

  expect(await screen.findByRole("heading", { name: "Confirm it's you" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
});

test("calls onContinue when the button is clicked", async () => {
  const user = userEvent.setup();
  const onContinue = vi.fn();
  renderWithRouter(<ConfirmView error={null} submitting={false} onContinue={onContinue} />);

  await user.click(await screen.findByRole("button", { name: "Continue" }));

  expect(onContinue).toHaveBeenCalledTimes(1);
});

test("disables the button and shows verifying label while submitting", async () => {
  renderWithRouter(<ConfirmView error={null} submitting={true} onContinue={vi.fn()} />);

  expect(await screen.findByRole("button", { name: "Verifying…" })).toBeDisabled();
});

test("shows error state with message and back to sign in link", async () => {
  renderWithRouter(
    <ConfirmView
      error="This link is invalid or has already been used. Please request a new one."
      submitting={false}
      onContinue={vi.fn()}
    />,
  );

  expect(await screen.findByRole("heading", { name: "Link invalid" })).toBeInTheDocument();
  expect(
    screen.getByText("This link is invalid or has already been used. Please request a new one."),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Back to sign in" })).toBeInTheDocument();
});
