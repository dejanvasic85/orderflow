import {
  createFileRoute,
  useNavigate,
  useRouteContext,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AccountEditPanel } from "@/components/accounts/AccountEditPanel";
import { AccountList } from "@/components/accounts/AccountList";
import { WhenAllowed } from "@/components/auth/WhenAllowed";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useDelayedBoolean } from "@/hooks/use-delayed-boolean";
import { useMediaQuery } from "@/hooks/use-media-query";
import { createAccount, listAccounts, updateAccount } from "@/lib/accounts/accounts.functions";
import type { Account, PagedAccountsResult } from "@/lib/accounts/schema";
import { accountPageSize, listAccountsSearchSchema } from "@/lib/accounts/schema";
import { can, permissions } from "@/lib/permissions";
import { asResult } from "@/lib/result";

export const Route = createFileRoute("/_protected/manage/accounts/")({
  validateSearch: listAccountsSearchSchema,
  loaderDeps: ({ search }) => ({ q: search.q, page: search.page }),
  loader: async ({ deps }) => {
    const result = asResult<PagedAccountsResult>(
      await listAccounts({ data: { q: deps.q, page: deps.page } }),
    );
    if (!result.ok) throw new Error(result.error.message);
    return { accounts: result.value.accounts, total: result.value.total };
  },
  component: AccountsPage,
});

function AccountsPage() {
  const { accounts: loadedAccounts, total } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const routerLoading = useRouterState({ select: (s) => s.isLoading });
  const isLoading = useDelayedBoolean(routerLoading);
  const { user } = useRouteContext({ from: "/_protected" });
  const canWriteAccounts = can(user.user_role, permissions.accounts.write);

  const [accounts, setAccounts] = useState<Account[]>(loadedAccounts);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setAccounts(loadedAccounts);
  }, [loadedAccounts]);

  const selectedAccount = accounts.find((a) => a.id === selectedId) ?? null;
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const panelSide = isDesktop ? "right" : "bottom";
  const panelClassName = "overflow-y-auto p-0 sm:w-[50vw] sm:min-w-[800px]";

  const searchQuery = search.q ?? "";
  const currentPage = search.page ?? 1;
  const totalPages = Math.ceil(total / accountPageSize);

  function handleSearchChange(q: string) {
    void navigate({
      to: "/manage/accounts",
      search: { q: q || undefined, page: undefined },
      replace: true,
    });
  }

  function handlePageChange(page: number) {
    void navigate({
      to: "/manage/accounts",
      search: { q: search.q, page: page === 1 ? undefined : page },
      replace: true,
    });
  }

  function handleSelectAccount(account: Account) {
    setSelectedId(account.id);
    setCreating(false);
  }

  function handleStartCreate() {
    setSelectedId(null);
    setCreating(true);
  }

  function handleDiscard() {
    setSelectedId(null);
    setCreating(false);
  }

  async function handleSave(updated: Account) {
    const result = asResult<Account>(
      await updateAccount({
        data: {
          id: updated.id,
          name: updated.name,
          contactName: updated.contactName,
          contactEmail: updated.contactEmail,
          contactPhone: updated.contactPhone,
          deliveryAddress: updated.deliveryAddress,
          deliveryInstructions: updated.deliveryInstructions,
        },
      }),
    );
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    setAccounts((prev) => prev.map((a) => (a.id === updated.id ? result.value : a)));
    setSelectedId(null);
  }

  async function handleCreate(draft: Account) {
    const result = asResult<Account>(
      await createAccount({
        data: {
          name: draft.name,
          contactName: draft.contactName,
          contactEmail: draft.contactEmail,
          contactPhone: draft.contactPhone,
          deliveryAddress: draft.deliveryAddress,
          deliveryInstructions: draft.deliveryInstructions,
        },
      }),
    );
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    setCreating(false);
    toast.success(`Account "${result.value.name}" created`);
    void navigate({
      to: "/manage/accounts",
      search: { q: search.q, page: undefined },
      replace: true,
    });
  }

  return (
    <>
      <PageHeader
        title="Accounts"
        actions={
          <WhenAllowed permission={permissions.accounts.write}>
            <Button onClick={handleStartCreate}>+ New account</Button>
          </WhenAllowed>
        }
      />
      <PageContent>
        <AccountList
          accounts={accounts}
          total={total}
          selectedId={selectedId}
          searchQuery={searchQuery}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          readOnly={!canWriteAccounts}
          onSelectAccount={handleSelectAccount}
          onSearchChange={handleSearchChange}
          onPageChange={handlePageChange}
        />

        <Sheet open={!!selectedAccount} onOpenChange={(open) => !open && handleDiscard()}>
          <SheetContent side={panelSide} className={panelClassName}>
            <SheetHeader className="sr-only">
              <SheetTitle>Account details</SheetTitle>
              <SheetDescription>View and edit account details</SheetDescription>
            </SheetHeader>
            {selectedAccount && (
              <AccountEditPanel
                key={selectedAccount.id}
                account={selectedAccount}
                readOnly={!canWriteAccounts}
                onSave={handleSave}
                onDiscard={handleDiscard}
              />
            )}
          </SheetContent>
        </Sheet>

        <Sheet open={creating} onOpenChange={(open) => !open && handleDiscard()}>
          <SheetContent side={panelSide} className={panelClassName}>
            <SheetHeader className="sr-only">
              <SheetTitle>New account</SheetTitle>
              <SheetDescription>Create a new account</SheetDescription>
            </SheetHeader>
            {creating && (
              <AccountEditPanel
                account={{
                  id: "",
                  name: "",
                  contactName: null,
                  contactEmail: null,
                  contactPhone: null,
                  deliveryAddress: null,
                  deliveryInstructions: null,
                  createdAt: "",
                  updatedAt: "",
                  userCount: 0,
                }}
                onSave={handleCreate}
                onDiscard={handleDiscard}
              />
            )}
          </SheetContent>
        </Sheet>
      </PageContent>
    </>
  );
}
