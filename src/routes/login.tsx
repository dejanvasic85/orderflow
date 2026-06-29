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
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1.5 pr-4 pl-1.5 text-sm font-semibold text-foreground no-underline shadow-[var(--shadow-xs)] transition-colors hover:bg-muted"
          >
            <img src="/icon.svg" alt="" className="h-6 w-6 rounded-[7px]" width={24} height={24} />
            {company.shortName}
          </Link>
        </div>

        <div className="mb-8 max-w-sm">
          <h1 className="mb-3">Sign in</h1>
          <p className="text-lg text-muted-foreground">Welcome back to {company.name}</p>
        </div>

        <div className="w-full max-w-sm">
          <LoginForm onLogin={handleLogin} />
        </div>
      </div>

      {/* Right panel — desktop only */}
      <div className="relative hidden flex-1 flex-col items-start justify-center overflow-hidden bg-primary px-16 py-20 lg:flex">
        {/* Warm depth: a soft radial glow + subtle vignette over the burgundy */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_15%_0%,rgba(255,255,255,0.16),transparent_55%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(100%_100%_at_100%_100%,rgba(0,0,0,0.28),transparent_60%)]"
        />
        <blockquote className="relative max-w-lg">
          <p className="mb-8 font-heading text-5xl leading-[1.1] font-medium tracking-tight text-primary-foreground">
            Order management,
            <br />
            poured with care.
          </p>
          <footer>
            <p className="text-sm font-semibold tracking-wide text-primary-foreground/80 uppercase">
              {company.name}
            </p>
          </footer>
        </blockquote>
      </div>
    </main>
  );
}
