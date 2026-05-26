import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SetPasswordView } from "@/components/auth/SetPasswordView";
import { updatePassword } from "@/lib/auth/setPassword.server";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth/set-password")({
  component: SetPasswordPage,
});

function SetPasswordPage() {
  const navigate = useNavigate();

  const handleSetPassword = (password: string) =>
    updatePassword({
      supabase,
      password,
      navigate: () => navigate({ to: "/dashboard" }),
    });

  return <SetPasswordView onSetPassword={handleSetPassword} />;
}
