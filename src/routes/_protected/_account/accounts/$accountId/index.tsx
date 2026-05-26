import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
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
  const { accountId } = Route.useParams();
  const navigate = useNavigate();

  function handleCreateOrder() {
    void navigate({ to: "/accounts/$accountId/orders/new", params: { accountId } });
  }

  return (
    <>
      <PageHeader title={account.name} />
      <PageContent>
        <div>
          <Button onClick={handleCreateOrder}>
            <Plus className="mr-2 h-4 w-4" />
            Create Order
          </Button>
        </div>
      </PageContent>
    </>
  );
}
