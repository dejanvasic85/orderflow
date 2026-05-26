import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { AccountShell } from "@/components/layout/AccountShell";
import { listAccountsForCurrentUser } from "@/lib/accounts/accounts.functions";

export const Route = createFileRoute("/_protected/_account")({
  loader: async () => {
    const result = await listAccountsForCurrentUser();
    const accounts = result.ok ? result.value : [];
    return { hasMultipleAccounts: accounts.length > 1 };
  },
  component: AccountLayout,
});

function AccountLayout() {
  const { user } = Route.useRouteContext();
  const { hasMultipleAccounts } = Route.useLoaderData();
  const accountId = useRouterState({
    select: (s) => {
      const match = s.matches.find((m) => (m.params as Record<string, string>).accountId);
      return (match?.params as Record<string, string> | undefined)?.accountId ?? "";
    },
  });

  return (
    <AccountShell
      email={user.email ?? ""}
      accountId={accountId}
      hasMultipleAccounts={hasMultipleAccounts}
    >
      <Outlet />
    </AccountShell>
  );
}
