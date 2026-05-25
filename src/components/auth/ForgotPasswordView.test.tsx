import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ForgotPasswordView } from "@/components/auth/ForgotPasswordView";

function renderWithRouter(ui: React.ReactNode) {
  const rootRoute = createRootRoute({ component: () => ui });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory(),
  });
  return render(<RouterProvider router={router} />);
}

test("renders the form initially", async () => {
  renderWithRouter(<ForgotPasswordView onSubmit={vi.fn()} />);

  expect(await screen.findByRole("heading", { name: "Forgot password?" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Send reset link" })).toBeInTheDocument();
});

test("shows success message after form is submitted without error", async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn().mockResolvedValue({ ok: true, value: null });
  renderWithRouter(<ForgotPasswordView onSubmit={onSubmit} />);

  await user.type(await screen.findByLabelText("Email"), "alice@example.com");
  await user.click(screen.getByRole("button", { name: "Send reset link" }));

  expect(await screen.findByRole("heading", { name: "Check your inbox" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Send reset link" })).not.toBeInTheDocument();
});

test("stays on form when onSubmit returns an error", async () => {
  const user = userEvent.setup();
  const onSubmit = vi
    .fn()
    .mockResolvedValue({ ok: false, error: { message: "Rate limit exceeded" } });
  renderWithRouter(<ForgotPasswordView onSubmit={onSubmit} />);

  await user.type(await screen.findByLabelText("Email"), "alice@example.com");
  await user.click(screen.getByRole("button", { name: "Send reset link" }));

  expect(await screen.findByText("Rate limit exceeded")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Forgot password?" })).toBeInTheDocument();
});
