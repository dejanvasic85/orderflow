import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ok } from "@/lib/result";
import { CreateUserWithPasswordPanel } from "./CreateUserWithPasswordPanel";

describe("CreateUserWithPasswordPanel", () => {
  it("submits the mapped payload including the password", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(ok());
    render(
      <CreateUserWithPasswordPanel
        onCreate={onCreate}
        onCheckEmailExists={vi.fn().mockResolvedValue(false)}
        onClose={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText("First name"), "Sam");
    await user.type(screen.getByLabelText("Last name"), "Jones");
    await user.type(screen.getByLabelText("Email"), "sam@example.com");
    await user.type(screen.getByLabelText("Password"), "Sup3rSecret");
    await user.click(screen.getByRole("button", { name: "Create user" }));

    expect(onCreate).toHaveBeenCalledWith({
      email: "sam@example.com",
      name: "Sam Jones",
      phone: null,
      role: "user",
      password: "Sup3rSecret",
      notificationPreferences: { email: true, sms: false },
      accountIds: [],
    });
  });

  it("shows the password for handover after a successful create", async () => {
    const user = userEvent.setup();
    render(
      <CreateUserWithPasswordPanel
        onCreate={vi.fn().mockResolvedValue(ok())}
        onCheckEmailExists={vi.fn().mockResolvedValue(false)}
        onClose={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText("First name"), "Sam");
    await user.type(screen.getByLabelText("Last name"), "Jones");
    await user.type(screen.getByLabelText("Email"), "sam@example.com");
    await user.type(screen.getByLabelText("Password"), "Sup3rSecret");
    await user.click(screen.getByRole("button", { name: "Create user" }));

    expect(await screen.findByLabelText("Password")).toHaveValue("Sup3rSecret");
    expect(screen.getByLabelText("Email")).toHaveValue("sam@example.com");
  });

  it("rejects an email that already belongs to a user", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(ok());
    render(
      <CreateUserWithPasswordPanel
        onCreate={onCreate}
        onCheckEmailExists={vi.fn().mockResolvedValue(true)}
        onClose={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText("First name"), "Sam");
    await user.type(screen.getByLabelText("Last name"), "Jones");
    await user.type(screen.getByLabelText("Email"), "sam@example.com");
    await user.type(screen.getByLabelText("Password"), "Sup3rSecret");
    await user.click(screen.getByRole("button", { name: "Create user" }));

    expect(await screen.findByText("A user with this email already exists")).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("rejects a password that is too weak", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(ok());
    render(
      <CreateUserWithPasswordPanel
        onCreate={onCreate}
        onCheckEmailExists={vi.fn().mockResolvedValue(false)}
        onClose={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText("First name"), "Sam");
    await user.type(screen.getByLabelText("Last name"), "Jones");
    await user.type(screen.getByLabelText("Email"), "sam@example.com");
    await user.type(screen.getByLabelText("Password"), "short");
    await user.click(screen.getByRole("button", { name: "Create user" }));

    expect(await screen.findByText("Password must be at least 8 characters")).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("fills the password field with a generated password", async () => {
    const user = userEvent.setup();
    render(
      <CreateUserWithPasswordPanel
        onCreate={vi.fn().mockResolvedValue(ok())}
        onCheckEmailExists={vi.fn().mockResolvedValue(false)}
        onClose={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Generate" }));

    expect(screen.getByLabelText<HTMLInputElement>("Password").value).toHaveLength(14);
  });

  it("surfaces the server error and stays on the form", async () => {
    const user = userEvent.setup();
    render(
      <CreateUserWithPasswordPanel
        onCreate={vi.fn().mockResolvedValue({ ok: false, error: { message: "Email taken" } })}
        onCheckEmailExists={vi.fn().mockResolvedValue(false)}
        onClose={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText("First name"), "Sam");
    await user.type(screen.getByLabelText("Last name"), "Jones");
    await user.type(screen.getByLabelText("Email"), "sam@example.com");
    await user.type(screen.getByLabelText("Password"), "Sup3rSecret");
    await user.click(screen.getByRole("button", { name: "Create user" }));

    expect(await screen.findByText("Email taken")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create user" })).toBeInTheDocument();
  });

  it("calls onClose when discarded", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <CreateUserWithPasswordPanel
        onCreate={vi.fn().mockResolvedValue(ok())}
        onCheckEmailExists={vi.fn().mockResolvedValue(false)}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Discard" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
