import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResetPasswordView } from "@/components/auth/ResetPasswordView";

function renderWithRouter(ui: React.ReactNode) {
  const rootRoute = createRootRoute({ component: () => ui });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory(),
  });
  return render(<RouterProvider router={router} />);
}

test("shows expired-link message when token is invalid", async () => {
  renderWithRouter(<ResetPasswordView valid={false} error="Token has expired" onReset={vi.fn()} />);

  expect(await screen.findByRole("heading", { name: "Link expired" })).toBeInTheDocument();
  expect(screen.getByText("Token has expired")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Reset password" })).not.toBeInTheDocument();
});

test("shows reset form when token is valid", async () => {
  renderWithRouter(<ResetPasswordView valid={true} onReset={vi.fn()} />);

  expect(await screen.findByRole("heading", { name: "Reset password" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Reset password" })).toBeInTheDocument();
});

test("shows success screen after password is reset", async () => {
  const user = userEvent.setup();
  const onReset = vi.fn().mockResolvedValue(undefined);
  renderWithRouter(<ResetPasswordView valid={true} onReset={onReset} />);

  await user.type(await screen.findByLabelText("New password"), "Newpassword1");
  await user.type(screen.getByLabelText("Confirm new password"), "Newpassword1");
  await user.click(screen.getByRole("button", { name: "Reset password" }));

  expect(await screen.findByRole("heading", { name: "Password updated" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Reset password" })).not.toBeInTheDocument();
});

test("stays on form when onReset returns an error", async () => {
  const user = userEvent.setup();
  const onReset = vi.fn().mockResolvedValue({ error: "Session expired" });
  renderWithRouter(<ResetPasswordView valid={true} onReset={onReset} />);

  await user.type(await screen.findByLabelText("New password"), "Newpassword1");
  await user.type(screen.getByLabelText("Confirm new password"), "Newpassword1");
  await user.click(screen.getByRole("button", { name: "Reset password" }));

  expect(await screen.findByText("Session expired")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Reset password" })).toBeInTheDocument();
});
