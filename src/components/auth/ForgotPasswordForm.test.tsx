import { render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import {
  ForgotPasswordForm,
  type ForgotPasswordResult,
} from "@/components/auth/ForgotPasswordForm";

const onSubmit = vi.fn<(email: string) => Promise<ForgotPasswordResult>>();

let user: UserEvent;

beforeEach(() => {
  user = userEvent.setup();
});

test("renders email field and submit button", () => {
  render(<ForgotPasswordForm onSubmit={onSubmit} />);

  expect(screen.getByLabelText("Email")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Send reset link" })).toBeInTheDocument();
});

test("shows validation error when submitting empty email", async () => {
  render(<ForgotPasswordForm onSubmit={onSubmit} />);

  await user.click(screen.getByRole("button", { name: "Send reset link" }));

  expect(await screen.findByText("Invalid email address")).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();
});

test("calls onSubmit with email on valid submit", async () => {
  onSubmit.mockResolvedValue({ ok: true, value: null });
  render(<ForgotPasswordForm onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText("Email"), "alice@example.com");
  await user.click(screen.getByRole("button", { name: "Send reset link" }));

  await vi.waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith("alice@example.com");
  });
});

test("shows error returned from onSubmit", async () => {
  onSubmit.mockResolvedValue({ ok: false, error: { message: "Too many requests" } });
  render(<ForgotPasswordForm onSubmit={onSubmit} />);

  await user.type(screen.getByLabelText("Email"), "alice@example.com");
  await user.click(screen.getByRole("button", { name: "Send reset link" }));

  expect(await screen.findByText("Too many requests")).toBeInTheDocument();
});
