import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ChangePasswordForm, type ChangePasswordInput } from "@/components/auth/ChangePasswordForm";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { changePassword } from "@/lib/auth/auth.functions";
import { getPostLoginRedirect } from "@/lib/auth/userRedirect";
import { asResult } from "@/lib/result";

export const Route = createFileRoute("/_protected/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();

  async function handleChangePassword(input: ChangePasswordInput) {
    const result = asResult<void>(await changePassword({ data: input }));
    if (result.ok) {
      toast.success("Password changed");
      await navigate({ to: getPostLoginRedirect(user.user_role) });
    }
    return result;
  }

  return (
    <>
      <PageHeader title="Account settings" description="Manage your account security" />
      <PageContent className="mx-auto w-full max-w-md">
        <h2 className="text-sm font-medium">Change password</h2>
        <ChangePasswordForm onChangePassword={handleChangePassword} />
      </PageContent>
    </>
  );
}
