import { render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { LoginForm, type LoginResult, type LoginValues } from "@/components/auth/LoginForm";

const onLogin = vi.fn<(values: LoginValues) => Promise<LoginResult>>();

let user: UserEvent;

beforeEach(() => {
  user = userEvent.setup();
});

test("renders email, password, and submit", () => {
  render(<LoginForm onLogin={onLogin} />);

  expect(screen.getByLabelText("Email")).toBeInTheDocument();
  expect(screen.getByLabelText("Password")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
});

test("shows validation errors when submitting empty form", async () => {
  render(<LoginForm onLogin={onLogin} />);

  await user.click(screen.getByRole("button", { name: "Sign in" }));

  expect(await screen.findByText("Invalid email address")).toBeInTheDocument();
  expect(screen.getByText("Password is required")).toBeInTheDocument();
  expect(onLogin).not.toHaveBeenCalled();
});

test("calls onLogin with form values on valid submit", async () => {
  onLogin.mockResolvedValue(undefined);
  render(<LoginForm onLogin={onLogin} />);

  await user.type(screen.getByLabelText("Email"), "alice@example.com");
  await user.type(screen.getByLabelText("Password"), "hunter2");
  await user.click(screen.getByRole("button", { name: "Sign in" }));

  await vi.waitFor(() => {
    expect(onLogin).toHaveBeenCalledWith({
      email: "alice@example.com",
      password: "hunter2",
    });
  });
});

test("shows the error returned from onLogin", async () => {
  onLogin.mockResolvedValue({ error: "Invalid login credentials" });
  render(<LoginForm onLogin={onLogin} />);

  await user.type(screen.getByLabelText("Email"), "alice@example.com");
  await user.type(screen.getByLabelText("Password"), "wrong");
  await user.click(screen.getByRole("button", { name: "Sign in" }));

  expect(await screen.findByText("Invalid login credentials")).toBeInTheDocument();
});
