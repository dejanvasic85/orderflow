import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditProfileForm } from "./EditProfileForm";

const defaultValues = {
  firstName: "Jane",
  lastName: "Smith",
  email: "jane@example.com",
  phone: "0412345678",
  notifications: { email: true, sms: false },
};

const onSave = vi.fn();

beforeEach(() => {
  onSave.mockResolvedValue({ ok: true });
});

function renderForm(overrides?: Partial<typeof defaultValues>) {
  render(<EditProfileForm defaultValues={{ ...defaultValues, ...overrides }} onSave={onSave} />);
}

test("prefills first name and last name from defaultValues", async () => {
  renderForm();

  expect(await screen.findByLabelText("First name")).toHaveValue("Jane");
  expect(screen.getByLabelText("Last name")).toHaveValue("Smith");
});

test("prefills phone from defaultValues", async () => {
  renderForm();

  expect(await screen.findByLabelText("Contact number")).toHaveValue("0412345678");
});

test("displays email read-only and not editable", async () => {
  renderForm();

  const emailInput = await screen.findByLabelText("Email");
  expect(emailInput).toHaveValue("jane@example.com");
  expect(emailInput).toBeDisabled();
});

test("notification switches reflect defaultValues", async () => {
  renderForm();

  const emailSwitch = await screen.findByRole("switch", { name: "Email notifications" });
  const smsSwitch = screen.getByRole("switch", { name: /SMS notifications/ });

  expect(emailSwitch).toHaveAttribute("aria-checked", "true");
  expect(smsSwitch).toHaveAttribute("aria-checked", "false");
});

test("SMS switch is disabled and marked coming soon", async () => {
  renderForm();

  const smsSwitch = await screen.findByRole("switch", { name: /SMS notifications/ });

  expect(smsSwitch).toBeDisabled();
  expect(screen.getByText("(Coming soon)")).toBeInTheDocument();
});

test("submits with mapped name and notification preferences", async () => {
  const user = userEvent.setup();
  renderForm({ firstName: "John", lastName: "Doe", notifications: { email: true, sms: false } });

  await user.click(await screen.findByRole("button", { name: "Save details" }));

  expect(onSave).toHaveBeenCalledWith({
    name: "John Doe",
    phone: "0412345678",
    notificationPreferences: { email: true, sms: false },
  });
});

test("shows validation error for invalid AU phone number", async () => {
  const user = userEvent.setup();
  renderForm({ phone: "" });

  const phoneInput = await screen.findByLabelText("Contact number");
  await user.type(phoneInput, "12345");
  await user.click(screen.getByRole("button", { name: "Save details" }));

  expect(
    await screen.findByText("Mobile number must be 10 digits starting with 04"),
  ).toBeInTheDocument();
  expect(onSave).not.toHaveBeenCalled();
});

test("shows validation error when first name is empty", async () => {
  const user = userEvent.setup();
  renderForm({ firstName: "" });

  await user.click(await screen.findByRole("button", { name: "Save details" }));

  expect(await screen.findByText("First name is required")).toBeInTheDocument();
  expect(onSave).not.toHaveBeenCalled();
});

test("shows server error when onSave returns an error", async () => {
  onSave.mockResolvedValue({ ok: false, error: { message: "Something went wrong" } });
  const user = userEvent.setup();
  renderForm();

  await user.click(await screen.findByRole("button", { name: "Save details" }));

  expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
});

test("shows success message after successful save", async () => {
  const user = userEvent.setup();
  renderForm();

  await user.click(await screen.findByRole("button", { name: "Save details" }));

  expect(await screen.findByText("Details updated successfully.")).toBeInTheDocument();
});
