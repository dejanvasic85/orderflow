import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { SetPasswordResult } from "@/components/auth/SetPasswordForm";
import { SetPasswordView } from "@/components/auth/SetPasswordView";
import { setPassword } from "@/lib/auth/auth.functions";

export const Route = createFileRoute("/auth/set-password")({
  component: SetPasswordPage,
});

function SetPasswordPage() {
  const navigate = useNavigate();

  const handleSetPassword = async (password: string): Promise<SetPasswordResult> => {
    const result = await setPassword({ data: { password } });
    if (result.ok) {
      await navigate({ to: "/manage/dashboard" });
    }
    return result;
  };

  return <SetPasswordView onSetPassword={handleSetPassword} />;
}
