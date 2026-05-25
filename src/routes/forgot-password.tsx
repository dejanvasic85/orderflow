import { createFileRoute, redirect } from "@tanstack/react-router";
import { ForgotPasswordView } from "@/components/auth/ForgotPasswordView";
import { getSession } from "@/lib/authFunctions";
import { err, ok } from "@/lib/result";
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
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      console.log("Supabase error sending reset email", error);
      return err({ message: "We encountered an error processing this request. Please try again." });
    }
    return ok();
  };

  return <ForgotPasswordView onSubmit={handleSubmit} />;
}
