import { render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { SetPasswordForm, type SetPasswordResult } from "@/components/auth/SetPasswordForm";

const onSetPassword = vi.fn<(password: string) => Promise<SetPasswordResult>>();

let user: UserEvent;

beforeEach(() => {
  user = userEvent.setup();
});

test("renders password, confirm password, and submit button", () => {
  render(<SetPasswordForm onSetPassword={onSetPassword} />);

  expect(screen.getByLabelText("Password")).toBeInTheDocument();
  expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Set password" })).toBeInTheDocument();
});

test("shows validation errors when submitting empty form", async () => {
  render(<SetPasswordForm onSetPassword={onSetPassword} />);

  await user.click(screen.getByRole("button", { name: "Set password" }));

  expect(await screen.findByText("Password must be at least 6 characters")).toBeInTheDocument();
  expect(screen.getByText("Please confirm your password")).toBeInTheDocument();
  expect(onSetPassword).not.toHaveBeenCalled();
});

test("shows validation error when passwords do not match", async () => {
  render(<SetPasswordForm onSetPassword={onSetPassword} />);

  await user.type(screen.getByLabelText("Password"), "secret1");
  await user.type(screen.getByLabelText("Confirm password"), "secret2");
  await user.click(screen.getByRole("button", { name: "Set password" }));

  expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
  expect(onSetPassword).not.toHaveBeenCalled();
});

test("calls onSetPassword with the password value on valid submit", async () => {
  onSetPassword.mockResolvedValue(undefined);
  render(<SetPasswordForm onSetPassword={onSetPassword} />);

  await user.type(screen.getByLabelText("Password"), "mysecret");
  await user.type(screen.getByLabelText("Confirm password"), "mysecret");
  await user.click(screen.getByRole("button", { name: "Set password" }));

  await vi.waitFor(() => {
    expect(onSetPassword).toHaveBeenCalledWith("mysecret");
  });
});

test("shows the error returned from onSetPassword", async () => {
  onSetPassword.mockResolvedValue({ error: "Password is too weak" });
  render(<SetPasswordForm onSetPassword={onSetPassword} />);

  await user.type(screen.getByLabelText("Password"), "mysecret");
  await user.type(screen.getByLabelText("Confirm password"), "mysecret");
  await user.click(screen.getByRole("button", { name: "Set password" }));

  expect(await screen.findByText("Password is too weak")).toBeInTheDocument();
});
