import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/auth/LoginForm";

const navigate = vi.fn();
const signInWithPassword = vi.fn();

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    useRouter: () => ({ navigate }) as unknown as ReturnType<typeof actual.useRouter>,
  };
});

vi.mock("@/lib/supabase", () => ({
  supabase: { auth: { signInWithPassword: (...args: unknown[]) => signInWithPassword(...args) } },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test("renders email, password, and submit", () => {
  render(<LoginForm />);

  expect(screen.getByLabelText("Email")).toBeInTheDocument();
  expect(screen.getByLabelText("Password")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
});

test("shows validation errors when submitting empty form", async () => {
  const user = userEvent.setup();
  render(<LoginForm />);

  await user.click(screen.getByRole("button", { name: "Sign in" }));

  expect(await screen.findByText("Invalid email address")).toBeInTheDocument();
  expect(screen.getByText("Password is required")).toBeInTheDocument();
  expect(signInWithPassword).not.toHaveBeenCalled();
});

test("signs in and navigates to dashboard on success", async () => {
  signInWithPassword.mockResolvedValue({ error: null });
  const user = userEvent.setup();
  render(<LoginForm />);

  await user.type(screen.getByLabelText("Email"), "alice@example.com");
  await user.type(screen.getByLabelText("Password"), "hunter2");
  await user.click(screen.getByRole("button", { name: "Sign in" }));

  await vi.waitFor(() => {
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "alice@example.com",
      password: "hunter2",
    });
  });
  expect(navigate).toHaveBeenCalledWith({ to: "/dashboard" });
});

test("shows the supabase error message and does not navigate on failure", async () => {
  signInWithPassword.mockResolvedValue({ error: { message: "Invalid login credentials" } });
  const user = userEvent.setup();
  render(<LoginForm />);

  await user.type(screen.getByLabelText("Email"), "alice@example.com");
  await user.type(screen.getByLabelText("Password"), "wrong");
  await user.click(screen.getByRole("button", { name: "Sign in" }));

  expect(await screen.findByText("Invalid login credentials")).toBeInTheDocument();
  expect(navigate).not.toHaveBeenCalled();
});
