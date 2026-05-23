import { createFileRoute, redirect } from "@tanstack/react-router";
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
  const handleSubmit = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) {
      return { error: error.message };
    }
  };

  return <ForgotPasswordView onSubmit={handleSubmit} />;
}
