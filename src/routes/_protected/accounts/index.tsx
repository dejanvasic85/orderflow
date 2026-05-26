import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { AccountSelectionView } from "@/components/accounts/AccountSelectionView";
import { Skeleton } from "@/components/ui/skeleton";
import { listAccountsForCurrentUser } from "@/lib/accounts/accounts.functions";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_protected/accounts/")({
  loader: async () => {
    const result = await listAccountsForCurrentUser();
    if (!result.ok) return { accounts: [] };
    const accounts = result.value;
    if (accounts.length === 1) {
      throw redirect({
        to: "/accounts/$accountId",
        params: { accountId: accounts[0].id },
      });
    }
    return { accounts };
  },
  pendingComponent: AccountSelectionSkeleton,
  component: AccountSelectionPage,
});

function AccountSelectionSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function AccountSelectionPage() {
  const { accounts } = Route.useLoaderData();
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    void navigate({ to: "/" });
  }

  function handleSelectAccount(accountId: string) {
    void navigate({ to: "/accounts/$accountId", params: { accountId } });
  }

  return (
    <AccountSelectionView
      accounts={accounts}
      onSelectAccount={handleSelectAccount}
      onSignOut={handleSignOut}
    />
  );
}
