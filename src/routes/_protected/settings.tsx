import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { ChangePasswordForm, type ChangePasswordInput } from "@/components/auth/ChangePasswordForm";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { changePassword } from "@/lib/auth/auth.functions";
import { asResult } from "@/lib/result";

export const Route = createFileRoute("/_protected/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  async function handleChangePassword(input: ChangePasswordInput) {
    const result = asResult<void>(await changePassword({ data: input }));
    if (result.ok) {
      toast.success("Password changed");
    }
    return result;
  }

  return (
    <>
      <PageHeader title="Account settings" description="Manage your account security" />
      <PageContent className="max-w-md">
        <h2 className="text-sm font-medium">Change password</h2>
        <ChangePasswordForm onChangePassword={handleChangePassword} />
      </PageContent>
    </>
  );
}
