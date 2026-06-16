import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ChangePasswordForm, type ChangePasswordInput } from "@/components/auth/ChangePasswordForm";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { changePassword, getPasswordChangedAt } from "@/lib/auth/auth.functions";
import { getPostLoginRedirect } from "@/lib/auth/userRedirect";
import { formatDateTime } from "@/lib/dates";
import { asResult } from "@/lib/result";

export const Route = createFileRoute("/_protected/settings")({
  loader: async () => {
    const result = asResult<string | null>(await getPasswordChangedAt());
    if (!result.ok) throw new Error(result.error.message);
    return { passwordChangedAt: result.value };
  },
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = Route.useRouteContext();
  const { passwordChangedAt } = Route.useLoaderData();
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
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-medium">Change password</h2>
          <p className="text-sm text-muted-foreground">
            {passwordChangedAt
              ? `Last changed ${formatDateTime(passwordChangedAt)}`
              : "Password never changed"}
          </p>
        </div>
        <ChangePasswordForm onChangePassword={handleChangePassword} />
      </PageContent>
    </>
  );
}
