import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ResetPasswordForm, type ResetPasswordResult } from "@/components/auth/ResetPasswordForm";
import { company } from "@/lib/config";

type Props = {
  valid: boolean;
  error?: string;
  onReset: (password: string) => Promise<ResetPasswordResult>;
};

export function ResetPasswordView({ valid, error, onReset }: Props) {
  const [succeeded, setSucceeded] = useState(false);

  const handleReset = async (password: string): Promise<ResetPasswordResult> => {
    const result = await onReset(password);
    if (!result?.error) {
      setSucceeded(true);
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

        {!valid ? (
          <div className="max-w-sm">
            <h1 className="mb-2 text-3xl font-semibold tracking-tight">Link expired</h1>
            <p className="mb-6 text-muted-foreground">
              {error ?? "This password reset link is invalid or has expired."}
            </p>
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              Request a new reset link
            </Link>
          </div>
        ) : succeeded ? (
          <div className="max-w-sm">
            <h1 className="mb-2 text-3xl font-semibold tracking-tight">Password updated</h1>
            <p className="mb-6 text-muted-foreground">
              Your password has been reset successfully. You can now sign in with your new password.
            </p>
            <Link
              to="/login"
              className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 max-w-sm">
              <h1 className="mb-2 text-3xl font-semibold tracking-tight">Reset password</h1>
              <p className="text-muted-foreground">Enter a new password for your account.</p>
            </div>

            <div className="w-full max-w-sm">
              <ResetPasswordForm onReset={handleReset} />
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
