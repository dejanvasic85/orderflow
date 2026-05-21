import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { vi } from "vitest";
import { PendingInviteSection } from "./PendingInviteSection";

vi.mock("sonner");

const fixedDate = "2026-05-20T09:00:00.000Z";

describe("PendingInviteSection", () => {
  afterEach(() => {
    vi.useRealTimers();
  });
  it("renders the invitation sent date", () => {
    render(<PendingInviteSection invitedAt={fixedDate} onResend={vi.fn()} />);

    expect(screen.getByText(/Sent/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /resend invitation/i })).toBeInTheDocument();
  });

  it("disables the button while resend is in flight", async () => {
    const user = userEvent.setup();
    let resolve: () => void;
    const onResend = vi.fn(
      () =>
        new Promise<void>((r) => {
          resolve = r;
        }),
    );

    render(<PendingInviteSection invitedAt={fixedDate} onResend={onResend} />);

    await user.click(screen.getByRole("button", { name: /resend invitation/i }));

    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();

    resolve!();
  });

  it("shows a success toast and updates the date on successful resend", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2027-01-15T12:00:00.000Z"));
    const user = userEvent.setup();
    const onResend = vi.fn().mockResolvedValue(undefined);

    render(<PendingInviteSection invitedAt={fixedDate} onResend={onResend} />);

    await user.click(screen.getByRole("button", { name: /resend invitation/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Invitation sent");
    });

    expect(screen.getByRole("button", { name: /resend invitation/i })).toBeEnabled();
    expect(screen.getByText(/Sent/i).textContent).toContain("2027");
  });

  it("shows an error toast and keeps the original date when resend fails", async () => {
    const user = userEvent.setup();
    const onResend = vi.fn().mockRejectedValue(new Error("Network error"));

    render(<PendingInviteSection invitedAt={fixedDate} onResend={onResend} />);

    await user.click(screen.getByRole("button", { name: /resend invitation/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to resend invitation");
    });

    expect(screen.getByRole("button", { name: /resend invitation/i })).toBeEnabled();
  });
});
