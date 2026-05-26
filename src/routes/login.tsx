import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { LoginForm, type LoginValues } from "@/components/auth/LoginForm";
import { getSession } from "@/lib/auth/auth.functions";
import { getPostLoginRedirect } from "@/lib/auth/userRedirect";
import { company } from "@/lib/config";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const user = await getSession();
    if (user) {
      throw redirect({ to: getPostLoginRedirect(user.user_role) });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();

  const handleLogin = async (values: LoginValues) => {
    const { data, error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      return { error: error.message ?? "Sign in failed" };
    }
    const token = data.session?.access_token ?? "";
    let userRole: string | undefined;
    if (token) {
      try {
        const base64Url = token.split(".")[1] ?? "";
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
        const payload = JSON.parse(atob(padded)) as { user_role?: string };
        userRole = payload.user_role;
      } catch {
        userRole = undefined;
      }
    }
    const to = getPostLoginRedirect(userRole);
    await router.navigate({ to });
  };

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
          <LoginForm onLogin={handleLogin} />
        </div>
      </div>

      {/* Right panel — desktop only */}
      <div className="hidden flex-1 flex-col items-start justify-center bg-foreground px-16 py-20 lg:flex">
        <blockquote className="max-w-lg">
          <p className="mb-8 text-4xl font-semibold leading-snug tracking-tight text-background">
            "Order management built for wholesale"
          </p>
          <footer>
            <p className="text-sm font-semibold text-background">{company.name}</p>
          </footer>
        </blockquote>
      </div>
    </main>
  );
}
