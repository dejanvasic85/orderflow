import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordView } from "@/components/auth/ResetPasswordView";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const handleReset = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      return { error: error.message };
    }
    await supabase.auth.signOut();
  };

  return <ResetPasswordView valid={true} onReset={handleReset} />;
}
