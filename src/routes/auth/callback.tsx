import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { company } from "@/lib/config";
import { supabase } from "@/lib/supabase";

const callbackSearchSchema = z.object({
  code: z.string().optional(),
  type: z.string().optional(),
});

export const Route = createFileRoute("/auth/callback")({
  validateSearch: callbackSearchSchema,
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const { code, type } = Route.useSearch();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verify() {
      if (!code) {
        setError("Invalid or missing verification code. The link may have expired.");
        return;
      }

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        setError(exchangeError.message);
        return;
      }

      await navigate({ to: type === "invite" ? "/auth/set-password" : "/dashboard" });
    }

    void verify();
  }, [code, type, navigate]);

  return (
    <main className="fixed inset-0 z-10 flex overflow-auto bg-background">
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

        <div className="max-w-sm">
          {error ? (
            <>
              <h1 className="mb-2 text-3xl font-semibold tracking-tight">Link invalid</h1>
              <p className="mb-6 text-muted-foreground">{error}</p>
              <Link
                to="/login"
                className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                Back to sign in
              </Link>
            </>
          ) : (
            <>
              <h1 className="mb-2 text-3xl font-semibold tracking-tight">Verifying…</h1>
              <p className="text-muted-foreground">Please wait while we verify your link.</p>
            </>
          )}
        </div>
      </div>

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
