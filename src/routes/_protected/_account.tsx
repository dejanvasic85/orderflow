import { Outlet, createFileRoute, useRouter, useRouterState } from "@tanstack/react-router";
import { AccountShell } from "@/components/layout/AccountShell";
import { listAccountsForCurrentUser } from "@/lib/accounts/accounts.functions";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_protected/_account")({
  loader: async () => {
    const result = await listAccountsForCurrentUser();
    if (!result.ok) throw new Error(result.error.message);
    return { hasMultipleAccounts: result.value.length > 1 };
  },
  component: AccountLayout,
});

function AccountLayout() {
  const { user } = Route.useRouteContext();
  const { hasMultipleAccounts } = Route.useLoaderData();
  const router = useRouter();
  // Route matches are typed per-route; accountId only exists on some routes in this
  // layout's subtree, so TanStack Router can't narrow `params` across the whole array.
  const accountId = useRouterState({
    select: (s) => {
      const match = s.matches.find((m) => (m.params as Record<string, string>).accountId);
      return (match?.params as Record<string, string> | undefined)?.accountId ?? "";
    },
  });

  async function handleSignOut() {
    await supabase.auth.signOut();
    void router.navigate({ to: "/" });
  }

  return (
    <AccountShell
      email={user.email ?? ""}
      accountId={accountId}
      hasMultipleAccounts={hasMultipleAccounts}
      onSignOut={handleSignOut}
    >
      <Outlet />
    </AccountShell>
  );
}
