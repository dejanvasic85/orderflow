import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ForgotPasswordForm,
  type ForgotPasswordResult,
} from "@/components/auth/ForgotPasswordForm";
import { company } from "@/lib/config";

type Props = {
  onSubmit: (email: string) => Promise<ForgotPasswordResult>;
};

export function ForgotPasswordView({ onSubmit }: Props) {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (email: string): Promise<ForgotPasswordResult> => {
    const result = await onSubmit(email);
    if (result.ok) {
      setSubmitted(true);
    }
    return result;
  };

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

        {submitted ? (
          <div className="max-w-sm">
            <h1 className="mb-2 text-3xl font-semibold tracking-tight">Check your inbox</h1>
            <p className="mb-6 text-muted-foreground">
              We've sent a password reset link to your email. If it doesn't arrive within a few
              minutes, check your spam folder.
            </p>
            <Link
              to="/login"
              className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 max-w-sm">
              <h1 className="mb-2 text-3xl font-semibold tracking-tight">Forgot password?</h1>
              <p className="text-muted-foreground">
                Enter your email address and we'll send you a reset link.
              </p>
            </div>

            <div className="w-full max-w-sm">
              <ForgotPasswordForm onSubmit={handleSubmit} />
              <p className="mt-4 text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link
                  to="/login"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </>
        )}
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
