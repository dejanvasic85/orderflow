import { createFileRoute, redirect } from "@tanstack/react-router";
import type { ForgotPasswordResult } from "@/components/auth/ForgotPasswordForm";
import { ForgotPasswordView } from "@/components/auth/ForgotPasswordView";
import { getSession } from "@/lib/authFunctions";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/forgot-password")({
  beforeLoad: async () => {
    const user = await getSession();
    if (user) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const handleSubmit = async (email: string): Promise<ForgotPasswordResult> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) {
      // TODO: log the error
      return Promise.resolve({
        status: "failed",
        error: "We encountered an error processing this request. Please try again.",
      });
    }
    return Promise.resolve({ status: "success" });
  };

  return <ForgotPasswordView onSubmit={handleSubmit} />;
}
