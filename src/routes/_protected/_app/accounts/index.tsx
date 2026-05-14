import { createFileRoute } from "@tanstack/react-router";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { AccountCard } from "@/components/customer/AccountCard";
import { mockCustomerAccounts } from "@/components/customer/mockData";

export const Route = createFileRoute("/_protected/_app/accounts/")({
  component: AccountsPage,
});

function AccountsPage() {
  return (
    <>
      <PageHeader title="Accounts" />
      <PageContent>
        <div className="mx-auto w-full max-w-2xl flex flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground px-1">
            Your accounts
          </p>
          {mockCustomerAccounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      </PageContent>
    </>
  );
}
