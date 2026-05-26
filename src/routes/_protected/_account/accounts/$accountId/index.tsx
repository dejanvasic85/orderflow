import { createFileRoute, notFound } from "@tanstack/react-router";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { getAccount } from "@/lib/accounts/accounts.functions";

export const Route = createFileRoute("/_protected/_account/accounts/$accountId/")({
  loader: async ({ params }) => {
    const result = await getAccount({ data: params.accountId });
    if (!result.ok) throw new Error(result.error.message);
    if (!result.value) throw notFound();
    return { account: result.value };
  },
  component: AccountPage,
});

function AccountPage() {
  const { account } = Route.useLoaderData();

  return (
    <>
      <PageHeader title={account.name} />
      <PageContent>
        <p className="text-muted-foreground">Welcome to BWOW.</p>
      </PageContent>
    </>
  );
}
