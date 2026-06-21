import { render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import {
  ChangePasswordForm,
  type ChangePasswordInput,
  type ChangePasswordResult,
} from "@/components/auth/ChangePasswordForm";

const onChangePassword = vi.fn<(input: ChangePasswordInput) => Promise<ChangePasswordResult>>();

let user: UserEvent;

beforeEach(() => {
  user = userEvent.setup();
});

test("renders current password, new password, confirm password, and submit button", () => {
  render(<ChangePasswordForm onChangePassword={onChangePassword} />);

  expect(screen.getByLabelText("Current password")).toBeInTheDocument();
  expect(screen.getByLabelText("New password")).toBeInTheDocument();
  expect(screen.getByLabelText("Confirm new password")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Change password" })).toBeInTheDocument();
});

test("shows validation errors when submitting empty form", async () => {
  render(<ChangePasswordForm onChangePassword={onChangePassword} />);

  await user.click(screen.getByRole("button", { name: "Change password" }));

  expect(await screen.findByText("Enter your current password")).toBeInTheDocument();
  expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
  expect(screen.getByText("Please confirm your password")).toBeInTheDocument();
  expect(onChangePassword).not.toHaveBeenCalled();
});

test("shows validation error when new passwords do not match", async () => {
  render(<ChangePasswordForm onChangePassword={onChangePassword} />);

  await user.type(screen.getByLabelText("Current password"), "oldsecret");
  await user.type(screen.getByLabelText("New password"), "Newsecret1");
  await user.type(screen.getByLabelText("Confirm new password"), "Newsecret2");
  await user.click(screen.getByRole("button", { name: "Change password" }));

  expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
  expect(onChangePassword).not.toHaveBeenCalled();
});

test("shows validation error when new password matches current password", async () => {
  render(<ChangePasswordForm onChangePassword={onChangePassword} />);

  await user.type(screen.getByLabelText("Current password"), "Samesecret1");
  await user.type(screen.getByLabelText("New password"), "Samesecret1");
  await user.type(screen.getByLabelText("Confirm new password"), "Samesecret1");
  await user.click(screen.getByRole("button", { name: "Change password" }));

  expect(
    await screen.findByText("Choose a password different from your current one"),
  ).toBeInTheDocument();
  expect(onChangePassword).not.toHaveBeenCalled();
});

test("calls onChangePassword with current and new password on valid submit", async () => {
  onChangePassword.mockResolvedValue({ ok: true, value: undefined });
  render(<ChangePasswordForm onChangePassword={onChangePassword} />);

  await user.type(screen.getByLabelText("Current password"), "oldsecret");
  await user.type(screen.getByLabelText("New password"), "Newsecret1");
  await user.type(screen.getByLabelText("Confirm new password"), "Newsecret1");
  await user.click(screen.getByRole("button", { name: "Change password" }));

  await vi.waitFor(() => {
    expect(onChangePassword).toHaveBeenCalledWith({
      currentPassword: "oldsecret",
      newPassword: "Newsecret1",
    });
  });
});

test("shows the error returned from onChangePassword", async () => {
  onChangePassword.mockResolvedValue({
    ok: false,
    error: { message: "Current password is incorrect" },
  });
  render(<ChangePasswordForm onChangePassword={onChangePassword} />);

  await user.type(screen.getByLabelText("Current password"), "wrongsecret");
  await user.type(screen.getByLabelText("New password"), "Newsecret1");
  await user.type(screen.getByLabelText("Confirm new password"), "Newsecret1");
  await user.click(screen.getByRole("button", { name: "Change password" }));

  expect(await screen.findByText("Current password is incorrect")).toBeInTheDocument();
});
