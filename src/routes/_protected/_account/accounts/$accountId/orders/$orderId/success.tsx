import { createFileRoute, notFound } from "@tanstack/react-router";
import { OrderSuccessView } from "@/components/orderRequests/OrderSuccessView";
import { getAccount } from "@/lib/accounts/accounts.functions";
import { getOrderRequest } from "@/lib/orderRequests/orderRequests.functions";
import type { OrderRequestWithItems } from "@/lib/orderRequests/schema";

export const Route = createFileRoute(
  "/_protected/_account/accounts/$accountId/orders/$orderId/success",
)({
  loader: async ({ params }) => {
    const [accountResult, orderResult] = await Promise.all([
      getAccount({ data: params.accountId }),
      getOrderRequest({ data: params.orderId }),
    ]);

    if (!accountResult.ok) throw new Error(accountResult.error.message);
    if (!accountResult.value) throw notFound();
    if (!orderResult.ok) throw new Error(orderResult.error.message);
    if (!orderResult.value) throw notFound();

    return {
      account: accountResult.value,
      order: orderResult.value as OrderRequestWithItems,
    };
  },
  component: OrderSuccessPage,
});

function OrderSuccessPage() {
  const { accountId } = Route.useParams();
  const { order } = Route.useLoaderData();

  return <OrderSuccessView accountId={accountId} orderNumber={order.orderNumber} />;
}
