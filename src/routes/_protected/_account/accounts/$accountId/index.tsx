import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { OrderHistoryList } from "@/components/orderRequests/OrderHistoryList";
import { Button } from "@/components/ui/button";
import { getAccount } from "@/lib/accounts/accounts.functions";
import { listOrderHistory } from "@/lib/orderRequests/orderRequests.functions";
import { unwrapOrThrow, valueOrNotFound } from "@/lib/resultLoader";

export const Route = createFileRoute("/_protected/_account/accounts/$accountId/")({
  loader: async ({ params }) => {
    const [accountResult, historyResult] = await Promise.all([
      getAccount({ data: params.accountId }),
      listOrderHistory({ data: params.accountId }),
    ]);

    return {
      account: valueOrNotFound(unwrapOrThrow(accountResult)),
      orders: unwrapOrThrow(historyResult),
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
          // Hidden on mobile — the bottom nav provides the "New Order" shortcut there.
          <Button onClick={handleCreateOrder} className="hidden md:inline-flex">
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
          <OrderHistoryList
            orders={orders}
            buildViewHref={(orderId) => `/accounts/${accountId}/orders/${orderId}`}
            buildReorderHref={(order) =>
              `/accounts/${accountId}/orders/new?fromOrderId=${order.id}`
            }
          />
        </div>
      </PageContent>
    </>
  );
}
