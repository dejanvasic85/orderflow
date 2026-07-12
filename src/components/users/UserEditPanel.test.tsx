import { render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { makeUser } from "@/test/fixtures/userFixtures";
import { UserEditPanel } from "./UserEditPanel";

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

const baseUser = makeUser({
  name: "Alice Smith",
  email: "alice@example.com",
  inviteAcceptedAt: "2024-01-02T00:00:00Z",
  invitedAt: "2024-01-01T00:00:00Z",
  role: "staff",
});

const onSave = vi.fn();
const onDiscard = vi.fn();

let user: UserEvent;

beforeEach(() => {
  user = userEvent.setup();
});

test("renders user name and email as header", () => {
  render(<UserEditPanel user={baseUser} onSave={onSave} onDiscard={onDiscard} />);

  expect(screen.getByRole("heading", { name: "Alice Smith" })).toBeInTheDocument();
  expect(screen.getByText("alice@example.com")).toBeInTheDocument();
});

test("pre-fills first name and last name from user.name", () => {
  render(<UserEditPanel user={baseUser} onSave={onSave} onDiscard={onDiscard} />);

  expect(screen.getByLabelText("First name")).toHaveValue("Alice");
  expect(screen.getByLabelText("Last name")).toHaveValue("Smith");
});

test("shows validation errors when first and last name are cleared on submit", async () => {
  render(<UserEditPanel user={baseUser} onSave={onSave} onDiscard={onDiscard} />);

  await user.clear(screen.getByLabelText("First name"));
  await user.clear(screen.getByLabelText("Last name"));
  await user.click(screen.getByRole("button", { name: "Save changes" }));

  expect(await screen.findByText("First name is required")).toBeInTheDocument();
  expect(screen.getByText("Last name is required")).toBeInTheDocument();
  expect(onSave).not.toHaveBeenCalled();
});

test("calls onSave with joined name on valid submit", async () => {
  render(<UserEditPanel user={baseUser} onSave={onSave} onDiscard={onDiscard} />);

  await user.clear(screen.getByLabelText("First name"));
  await user.type(screen.getByLabelText("First name"), "Bob");
  await user.clear(screen.getByLabelText("Last name"));
  await user.type(screen.getByLabelText("Last name"), "Jones");
  await user.click(screen.getByRole("button", { name: "Save changes" }));

  await vi.waitFor(() => {
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: "Bob Jones" }), undefined);
  });
});

test("disables the button and shows Saving… while onSave is pending", async () => {
  let resolveSave: () => void = () => {};
  const pendingSave = vi.fn(() => new Promise<void>((resolve) => (resolveSave = resolve)));

  render(<UserEditPanel user={baseUser} onSave={pendingSave} onDiscard={onDiscard} />);

  await user.click(screen.getByRole("button", { name: "Save changes" }));

  const savingButton = await screen.findByRole("button", { name: "Saving…" });
  expect(savingButton).toBeDisabled();

  resolveSave();

  expect(await screen.findByRole("button", { name: "Save changes" })).toBeEnabled();
});

test("create mode shows Sending invite… while the email-exists check is pending", async () => {
  let resolveCheck: (exists: boolean) => void = () => {};
  const onCheckEmailExists = vi.fn(
    () => new Promise<boolean>((resolve) => (resolveCheck = resolve)),
  );

  render(
    <UserEditPanel
      mode="create"
      onSave={onSave}
      onDiscard={onDiscard}
      onCheckEmailExists={onCheckEmailExists}
    />,
  );

  await user.type(screen.getByLabelText("Email"), "new@example.com");
  await user.type(screen.getByLabelText("First name"), "Bob");
  await user.type(screen.getByLabelText("Last name"), "Jones");
  await user.click(screen.getByRole("button", { name: "Send invite" }));

  const pendingButton = await screen.findByRole("button", { name: "Sending invite…" });
  expect(pendingButton).toBeDisabled();

  resolveCheck(false);

  await vi.waitFor(() => expect(onSave).toHaveBeenCalled());
});

test("calls onDiscard when Discard button is clicked", async () => {
  render(<UserEditPanel user={baseUser} onSave={onSave} onDiscard={onDiscard} />);

  await user.click(screen.getByRole("button", { name: "Discard" }));

  expect(onDiscard).toHaveBeenCalled();
});

test("notification checkboxes reflect user preferences", () => {
  render(<UserEditPanel user={baseUser} onSave={onSave} onDiscard={onDiscard} />);

  expect(screen.getByLabelText("Email notifications")).toBeChecked();
  expect(screen.getByLabelText(/SMS notifications/)).not.toBeChecked();
});

test("SMS checkbox is disabled and marked coming soon", () => {
  render(<UserEditPanel user={baseUser} onSave={onSave} onDiscard={onDiscard} />);

  expect(screen.getByLabelText(/SMS notifications/)).toBeDisabled();
  expect(screen.getByText("(Coming soon)")).toBeInTheDocument();
});

test("create mode shows invite header and send invite button", () => {
  render(<UserEditPanel mode="create" onSave={onSave} onDiscard={onDiscard} />);

  expect(screen.getByRole("heading", { name: "Invite new user" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Send invite" })).toBeInTheDocument();
});

test("create mode enables the email input", () => {
  render(<UserEditPanel mode="create" onSave={onSave} onDiscard={onDiscard} />);

  expect(screen.getByLabelText("Email")).toBeEnabled();
});

test("pre-fills phone from user.phone", () => {
  render(
    <UserEditPanel
      user={{ ...baseUser, phone: "0412345678" }}
      onSave={onSave}
      onDiscard={onDiscard}
    />,
  );

  expect(screen.getByLabelText("Mobile number")).toHaveValue("0412345678");
});

test("shows empty phone input when user has no phone", () => {
  render(<UserEditPanel user={baseUser} onSave={onSave} onDiscard={onDiscard} />);

  expect(screen.getByLabelText("Mobile number")).toHaveValue("");
});

test("shows validation error when phone is not a valid Australian mobile number", async () => {
  render(<UserEditPanel user={baseUser} onSave={onSave} onDiscard={onDiscard} />);

  await user.type(screen.getByLabelText("Mobile number"), "1234567890");
  await user.click(screen.getByRole("button", { name: "Save changes" }));

  expect(
    await screen.findByText("Mobile number must be 10 digits starting with 04"),
  ).toBeInTheDocument();
  expect(onSave).not.toHaveBeenCalled();
});

test("passes phone as null to onSave when field is empty", async () => {
  render(<UserEditPanel user={baseUser} onSave={onSave} onDiscard={onDiscard} />);

  await user.click(screen.getByRole("button", { name: "Save changes" }));

  await vi.waitFor(() => {
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ phone: null }), undefined);
  });
});

test("passes valid Australian phone to onSave", async () => {
  render(<UserEditPanel user={baseUser} onSave={onSave} onDiscard={onDiscard} />);

  await user.type(screen.getByLabelText("Mobile number"), "0487654321");
  await user.click(screen.getByRole("button", { name: "Save changes" }));

  await vi.waitFor(() => {
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ phone: "0487654321" }),
      undefined,
    );
  });
});

test("create mode rejects submit when email is not a valid address", async () => {
  render(<UserEditPanel mode="create" onSave={onSave} onDiscard={onDiscard} />);

  await user.type(screen.getByLabelText("Email"), "not-an-email");
  await user.type(screen.getByLabelText("First name"), "Bob");
  await user.type(screen.getByLabelText("Last name"), "Jones");
  await user.click(screen.getByRole("button", { name: "Send invite" }));

  await vi.waitFor(() => {
    expect(onSave).not.toHaveBeenCalled();
  });
});

test("create mode submits with collected fields", async () => {
  render(<UserEditPanel mode="create" onSave={onSave} onDiscard={onDiscard} />);

  await user.type(screen.getByLabelText("Email"), "new@example.com");
  await user.type(screen.getByLabelText("First name"), "Bob");
  await user.type(screen.getByLabelText("Last name"), "Jones");
  await user.click(screen.getByRole("button", { name: "Send invite" }));

  await vi.waitFor(() => {
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "new@example.com",
        name: "Bob Jones",
      }),
      undefined,
    );
  });
});

test("create mode shows error and blocks submit when email already exists", async () => {
  const onCheckEmailExists = vi.fn().mockResolvedValue(true);

  render(
    <UserEditPanel
      mode="create"
      onSave={onSave}
      onDiscard={onDiscard}
      onCheckEmailExists={onCheckEmailExists}
    />,
  );

  await user.type(screen.getByLabelText("Email"), "existing@example.com");
  await user.type(screen.getByLabelText("First name"), "Bob");
  await user.type(screen.getByLabelText("Last name"), "Jones");
  await user.click(screen.getByRole("button", { name: "Send invite" }));

  expect(await screen.findByText("A user with this email already exists")).toBeInTheDocument();
  expect(onSave).not.toHaveBeenCalled();
});

test("create mode shows fallback error and blocks submit when email check throws", async () => {
  const onCheckEmailExists = vi.fn().mockRejectedValue(new Error("network error"));

  render(
    <UserEditPanel
      mode="create"
      onSave={onSave}
      onDiscard={onDiscard}
      onCheckEmailExists={onCheckEmailExists}
    />,
  );

  await user.type(screen.getByLabelText("Email"), "new@example.com");
  await user.type(screen.getByLabelText("First name"), "Bob");
  await user.type(screen.getByLabelText("Last name"), "Jones");
  await user.click(screen.getByRole("button", { name: "Send invite" }));

  expect(
    await screen.findByText("Unable to verify this email right now. Please try again."),
  ).toBeInTheDocument();
  expect(onSave).not.toHaveBeenCalled();
});

test("create mode does not show duplicate error when email is available", async () => {
  const onCheckEmailExists = vi.fn().mockResolvedValue(false);

  render(
    <UserEditPanel
      mode="create"
      onSave={onSave}
      onDiscard={onDiscard}
      onCheckEmailExists={onCheckEmailExists}
    />,
  );

  await user.type(screen.getByLabelText("Email"), "new@example.com");
  await user.type(screen.getByLabelText("First name"), "Bob");
  await user.type(screen.getByLabelText("Last name"), "Jones");
  await user.click(screen.getByRole("button", { name: "Send invite" }));

  await vi.waitFor(() => {
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ email: "new@example.com" }),
      undefined,
    );
  });
  expect(screen.queryByText("A user with this email already exists")).not.toBeInTheDocument();
});

test("shows Account access section in edit mode", () => {
  render(<UserEditPanel user={baseUser} onSave={onSave} onDiscard={onDiscard} />);

  expect(screen.getByText("Account access")).toBeInTheDocument();
  expect(
    screen.getByText(
      "Inactive users cannot log in. Their current session will remain active until it expires.",
    ),
  ).toBeInTheDocument();
});

test("Active switch is checked when user.active is true", () => {
  render(
    <UserEditPanel user={{ ...baseUser, active: true }} onSave={onSave} onDiscard={onDiscard} />,
  );

  expect(screen.getByRole("switch", { name: "Active" })).toBeChecked();
});

test("Active switch is unchecked when user.active is false", () => {
  render(
    <UserEditPanel user={{ ...baseUser, active: false }} onSave={onSave} onDiscard={onDiscard} />,
  );

  expect(screen.getByRole("switch", { name: "Active" })).not.toBeChecked();
});

test("does not show Account access section in create mode", () => {
  render(<UserEditPanel mode="create" onSave={onSave} onDiscard={onDiscard} />);

  expect(screen.queryByText("Account access")).not.toBeInTheDocument();
  expect(screen.queryByRole("switch", { name: "Active" })).not.toBeInTheDocument();
});

test("calls onSave with active: false when switch is toggled off", async () => {
  render(
    <UserEditPanel user={{ ...baseUser, active: true }} onSave={onSave} onDiscard={onDiscard} />,
  );

  await user.click(screen.getByRole("switch", { name: "Active" }));
  await user.click(screen.getByRole("button", { name: "Save changes" }));

  await vi.waitFor(() => {
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ active: false }), undefined);
  });
});

test("calls onSave with active: true when switch is toggled on", async () => {
  render(
    <UserEditPanel user={{ ...baseUser, active: false }} onSave={onSave} onDiscard={onDiscard} />,
  );

  await user.click(screen.getByRole("switch", { name: "Active" }));
  await user.click(screen.getByRole("button", { name: "Save changes" }));

  await vi.waitFor(() => {
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ active: true }), undefined);
  });
});

test("calls onSave with active: true when switch is not changed", async () => {
  render(
    <UserEditPanel user={{ ...baseUser, active: true }} onSave={onSave} onDiscard={onDiscard} />,
  );

  await user.click(screen.getByRole("button", { name: "Save changes" }));

  await vi.waitFor(() => {
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ active: true }), undefined);
  });
});
