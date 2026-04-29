import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSession } from "#/lib/authFunctions";

export const Route = createFileRoute("/signup")({
  beforeLoad: async () => {
    const session = await getSession();
    if (session) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: SignupPage,
});

function SignupPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="island-shell w-full max-w-sm rounded-2xl p-8">
        <div className="mb-8 text-center">
          <p className="island-kicker mb-2">Get started</p>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Create your account
          </h1>
        </div>
        <SignupForm />
        <p className="mt-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
          Already have an account?{" "}
          <a href="/login" className="font-medium">
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}

function SignupForm() {
  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="name"
          className="text-sm font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
          style={{
            background: "var(--bg-surface-strong)",
            borderColor: "var(--border-subtle)",
            color: "var(--text-primary)",
          }}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email"
          className="text-sm font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
          style={{
            background: "var(--bg-surface-strong)",
            borderColor: "var(--border-subtle)",
            color: "var(--text-primary)",
          }}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="password"
          className="text-sm font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
          style={{
            background: "var(--bg-surface-strong)",
            borderColor: "var(--border-subtle)",
            color: "var(--text-primary)",
          }}
        />
      </div>
      <button
        type="submit"
        className="button-cta mt-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
      >
        Create account
      </button>
    </form>
  );
}

async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  const form = e.currentTarget;
  const name = (form.elements.namedItem("name") as HTMLInputElement).value;
  const email = (form.elements.namedItem("email") as HTMLInputElement).value;
  const password = (form.elements.namedItem("password") as HTMLInputElement).value;

  const { authClient } = await import("#/lib/auth-client");
  const { error } = await authClient.signUp.email({
    name,
    email,
    password,
    callbackURL: "/dashboard",
  });

  if (error) {
    alert(error.message ?? "Sign up failed");
  }
}
