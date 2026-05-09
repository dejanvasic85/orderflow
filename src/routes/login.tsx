import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSession } from "#/lib/authFunctions";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const user = await getSession();
    if (user) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="mb-1 text-2xl font-semibold tracking-tight">Sign in to your account</h1>
          <p className="text-sm text-muted-foreground">Welcome back</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}

function LoginForm() {
  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
        />
      </div>
      <Button type="submit" className="mt-1 w-full">
        Sign in
      </Button>
    </form>
  );
}

async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  const form = e.currentTarget;
  const email = (form.elements.namedItem("email") as HTMLInputElement).value;
  const password = (form.elements.namedItem("password") as HTMLInputElement).value;

  const { supabase } = await import("#/lib/supabase");
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    alert(error.message ?? "Sign in failed");
  } else {
    window.location.href = "/dashboard";
  }
}
