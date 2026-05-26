import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listAccountsForCurrentUser } from "@/lib/accounts/accounts.functions";

export const Route = createFileRoute("/_protected/_app/accounts/")({
  loader: async () => {
    const result = await listAccountsForCurrentUser();
    if (!result.ok) return { accounts: [] };
    const accounts = result.value;
    if (accounts.length === 1) {
      throw redirect({ to: "/accounts/$accountId", params: { accountId: accounts[0].id } });
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

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Select an account
          </p>
          <p className="text-base">Which account are you ordering for?</p>
        </div>

        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No accounts assigned. Contact your administrator.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {accounts.map((account) => (
              <Button
                key={account.id}
                variant="outline"
                className="h-12 w-full justify-between px-4"
                onClick={() =>
                  navigate({ to: "/accounts/$accountId", params: { accountId: account.id } })
                }
              >
                <span className="font-medium">{account.name}</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
