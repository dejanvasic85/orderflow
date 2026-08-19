import { Link } from "@tanstack/react-router";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { Button } from "@/components/ui/button";

type Props = {
  error: string | null;
  submitting: boolean;
  onContinue: () => void;
};

export function ConfirmView({ error, submitting, onContinue }: Props) {
  return (
    <AuthSplitLayout>
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
          <h1 className="mb-2 text-3xl font-semibold tracking-tight">Confirm it's you</h1>
          <p className="mb-6 text-muted-foreground">
            Click continue to finish verifying your link. We ask for a click here so that automated
            email scanners can't use up the link before you do.
          </p>
          <Button onClick={onContinue} disabled={submitting}>
            {submitting ? "Verifying…" : "Continue"}
          </Button>
        </>
      )}
    </AuthSplitLayout>
  );
}
