import { createFileRoute, redirect } from "@tanstack/react-router";
import { ForgotPasswordView } from "@/components/auth/ForgotPasswordView";
import { getSession, requestPasswordReset } from "@/lib/auth/auth.functions";
import { getPostLoginRedirect } from "@/lib/auth/userRedirect";
import { err, ok } from "@/lib/result";

export const Route = createFileRoute("/forgot-password")({
  beforeLoad: async () => {
    const user = await getSession();
    if (user) {
      throw redirect({ to: getPostLoginRedirect(user.user_role) });
    }
  },
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const handleSubmit = async (email: string) => {
    const result = await requestPasswordReset({ data: { email, siteUrl: window.location.origin } });
    if (!result.success) {
      console.log("Error sending password reset email", result.message);
      return err({ message: "We encountered an error processing this request. Please try again." });
    }
    return ok();
  };

  return <ForgotPasswordView onSubmit={handleSubmit} />;
}
