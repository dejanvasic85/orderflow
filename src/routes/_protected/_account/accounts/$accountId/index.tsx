import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { OrderHistoryList } from "@/components/orderRequests/OrderHistoryList";
import { Button } from "@/components/ui/button";
import { getAccount } from "@/lib/accounts/accounts.functions";
import { listOrderHistory } from "@/lib/orderRequests/orderRequests.functions";

export const Route = createFileRoute("/_protected/_account/accounts/$accountId/")({
  loader: async ({ params }) => {
    const [accountResult, historyResult] = await Promise.all([
      getAccount({ data: params.accountId }),
      listOrderHistory({ data: params.accountId }),
    ]);

    if (!accountResult.ok) throw new Error(accountResult.error.message);
    if (!accountResult.value) throw notFound();
    if (!historyResult.ok) throw new Error(historyResult.error.message);

    return {
      account: accountResult.value,
      orders: historyResult.value,
    };
  },
  component: AccountPage,
});

function AccountPage() {
  const { account, orders } = Route.useLoaderData();
  const { accountId } = Route.useParams();
  const navigate = useNavigate();

  function handleCreateOrder() {
    void navigate({ to: "/accounts/$accountId/orders/new", params: { accountId } });
  }

  return (
    <>
      <PageHeader
        title={account.name}
        actions={
          <Button onClick={handleCreateOrder}>
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        }
      />
      <PageContent>
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Order History
          </h2>
          <OrderHistoryList orders={orders} />
        </div>
      </PageContent>
    </>
  );
}
