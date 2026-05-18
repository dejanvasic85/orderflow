import { Link } from "@tanstack/react-router";
import { SetPasswordForm, type SetPasswordResult } from "@/components/auth/SetPasswordForm";
import { company } from "@/lib/config";

type Props = {
  onSetPassword: (password: string) => Promise<SetPasswordResult>;
};

export function SetPasswordView({ onSetPassword }: Props) {
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

        <div className="mb-8 max-w-sm">
          <h1 className="mb-2 text-3xl font-semibold tracking-tight">Set your password</h1>
          <p className="text-muted-foreground">Choose a password to complete your account setup.</p>
        </div>

        <div className="w-full max-w-sm">
          <SetPasswordForm onSetPassword={onSetPassword} />
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
