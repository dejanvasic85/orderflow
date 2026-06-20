import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vite-plus/test";
import { SetUserPasswordPanel } from "./SetUserPasswordPanel";

const testUser = { id: "user-1", name: "Sam Taylor", email: "sam@bwow.com.au" };

import type { Result } from "@/lib/result";

type PwResult = Result<void, { message: string }>;

const okResult: PwResult = { ok: true, value: undefined };

function renderPanel(
  overrides: Partial<{
    onSetPassword: (password: string) => Promise<PwResult>;
    onSendResetEmail: () => Promise<PwResult>;
    onClose: () => void;
  }> = {},
) {
  const onSetPassword = vi
    .fn<(password: string) => Promise<PwResult>>()
    .mockResolvedValue(okResult);
  const onSendResetEmail = vi.fn<() => Promise<PwResult>>().mockResolvedValue(okResult);
  const onClose = vi.fn();

  render(
    <SetUserPasswordPanel
      user={testUser}
      onSetPassword={overrides.onSetPassword ?? onSetPassword}
      onSendResetEmail={overrides.onSendResetEmail ?? onSendResetEmail}
      onClose={overrides.onClose ?? onClose}
    />,
  );

  return { onSetPassword, onSendResetEmail, onClose };
}

describe("SetUserPasswordPanel", () => {
  it("renders user name and email in the header", () => {
    renderPanel();

    expect(screen.getByRole("heading", { name: "Set password" })).toBeInTheDocument();
    expect(screen.getByText(/Sam Taylor · sam@bwow\.com\.au/)).toBeInTheDocument();
  });

  it("renders the reset email button", () => {
    renderPanel();

    expect(screen.getByRole("button", { name: /send reset email/i })).toBeInTheDocument();
  });

  it("renders the password and confirm password fields", () => {
    renderPanel();

    expect(screen.getByLabelText("New password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();
  });

  it("calls onSendResetEmail when reset button is clicked", async () => {
    const user = userEvent.setup();
    const { onSendResetEmail } = renderPanel();

    await user.click(screen.getByRole("button", { name: /send reset email/i }));

    expect(onSendResetEmail).toHaveBeenCalledOnce();
  });

  it("shows validation error when passwords do not match", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.type(screen.getByLabelText("New password"), "secret1");
    await user.type(screen.getByLabelText("Confirm password"), "different");
    await user.click(screen.getByRole("button", { name: /^set password$/i }));

    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
  });

  it("shows validation error when password is too short", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.type(screen.getByLabelText("New password"), "abc");
    await user.type(screen.getByLabelText("Confirm password"), "abc");
    await user.click(screen.getByRole("button", { name: /^set password$/i }));

    expect(await screen.findByText("Password must be at least 6 characters")).toBeInTheDocument();
  });

  it("calls onSetPassword with the entered password when form is submitted", async () => {
    const user = userEvent.setup();
    const { onSetPassword } = renderPanel();

    await user.type(screen.getByLabelText("New password"), "newpass123");
    await user.type(screen.getByLabelText("Confirm password"), "newpass123");
    await user.click(screen.getByRole("button", { name: /^set password$/i }));

    expect(await vi.waitFor(() => onSetPassword.mock.calls.length > 0));
    expect(onSetPassword).toHaveBeenCalledWith("newpass123");
  });

  it("calls onClose when Cancel button is clicked", async () => {
    const user = userEvent.setup();
    const { onClose } = renderPanel();

    await user.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
