import { createFileRoute, notFound } from "@tanstack/react-router";
import { AccountUserSection } from "@/components/accounts/AccountUserSection";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { getAccount } from "@/lib/accounts/accounts.functions";
import { can, permissions } from "@/lib/permissions";

export const Route = createFileRoute("/_protected/manage/accounts/$accountId/users")({
  loader: async ({ params }) => {
    const accountResult = await getAccount({ data: params.accountId });
    if (!accountResult.ok) throw new Error(accountResult.error.message);
    if (!accountResult.value) throw notFound();
    return { account: accountResult.value };
  },
  component: AccountUsersPage,
});

function AccountUsersPage() {
  const { account } = Route.useLoaderData();
  const { user } = Route.useRouteContext() as { user: { user_role?: string } };
  const canManageUsers = can(user.user_role, permissions.accounts.manageUsers);

  return (
    <>
      <PageHeader
        title={`${account.name} — Users`}
        description="Manage which users have access to this account."
      />
      <PageContent>
        <AccountUserSection accountId={account.id} readOnly={!canManageUsers} />
      </PageContent>
    </>
  );
}
