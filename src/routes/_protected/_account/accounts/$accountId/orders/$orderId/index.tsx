import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { OrderDetailsView } from "@/components/orderRequests/OrderDetailsView";
import { getAccount } from "@/lib/accounts/accounts.functions";
import { getOrderRequest } from "@/lib/orderRequests/orderRequests.functions";
import type { OrderRequestWithItems } from "@/lib/orderRequests/schema";
import { formatOrderRef } from "@/lib/orderRequests/schema";

export const Route = createFileRoute("/_protected/_account/accounts/$accountId/orders/$orderId/")({
  loader: async ({ params }) => {
    const [accountResult, orderResult] = await Promise.all([
      getAccount({ data: params.accountId }),
      getOrderRequest({ data: params.orderId }),
    ]);

    if (!accountResult.ok) throw new Error(accountResult.error.message);
    if (!accountResult.value) throw notFound();
    if (!orderResult.ok) throw new Error(orderResult.error.message);
    if (!orderResult.value) throw notFound();
    if (orderResult.value.account_id !== params.accountId) throw notFound();

    return {
      account: accountResult.value,
      order: orderResult.value as OrderRequestWithItems,
    };
  },
  component: OrderDetailsPage,
});

function OrderDetailsPage() {
  const { account, order } = Route.useLoaderData();
  const { accountId } = Route.useParams();
  const navigate = useNavigate();

  function handleBack() {
    void navigate({ to: "/accounts/$accountId", params: { accountId } });
  }

  const placedByName = order.users?.name ?? "Unknown";

  return (
    <>
      <PageHeader title={formatOrderRef(order.order_number)} description={account.name} />
      <PageContent>
        <OrderDetailsView order={order} placedByName={placedByName} onBack={handleBack} />
      </PageContent>
    </>
  );
}
