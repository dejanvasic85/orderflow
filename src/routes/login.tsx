import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { getSession } from "@/lib/authFunctions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { company } from "@/lib/config";

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
    <main className="fixed inset-0 z-10 flex overflow-auto bg-background">
      {/* Left panel */}
      <div className="flex w-full flex-col justify-center px-8 py-12 lg:w-[42%] lg:px-16">
        <div className="mb-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm font-semibold text-foreground no-underline transition-colors hover:bg-muted"
          >
            <span className="h-2 w-2 rounded-full bg-foreground" />
            {company.shortName}
          </Link>
        </div>

        <div className="mb-8 max-w-sm">
          <h1 className="mb-2 text-3xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-muted-foreground">Welcome back to {company.name}</p>
        </div>

        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>

      {/* Right panel — desktop only */}
      <div className="hidden flex-1 flex-col items-start justify-center bg-foreground px-16 py-20 lg:flex">
        <blockquote className="max-w-lg">
          <p className="mb-8 text-4xl font-semibold leading-snug tracking-tight text-background">
            "The fastest way to go from SMS chaos to a system your whole team trusts."
          </p>
          <footer className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background/20 text-sm font-bold text-background">
              S
            </div>
            <div>
              <p className="text-sm font-semibold text-background">{company.name}</p>
              <p className="text-xs text-background/60">
                Order management built for wholesale
              </p>
            </div>
          </footer>
        </blockquote>
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

  const { supabase } = await import("@/lib/supabase");
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    alert(error.message ?? "Sign in failed");
  } else {
    window.location.href = "/dashboard";
  }
}
