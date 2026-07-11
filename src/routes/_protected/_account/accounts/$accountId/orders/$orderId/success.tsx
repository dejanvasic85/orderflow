import { createFileRoute } from "@tanstack/react-router";
import { OrderSuccessView } from "@/components/orderRequests/OrderSuccessView";
import { getAccount } from "@/lib/accounts/accounts.functions";
import { getOrderRequest } from "@/lib/orderRequests/orderRequests.functions";
import { unwrapOrThrow, valueOrNotFound } from "@/lib/resultLoader";

export const Route = createFileRoute(
  "/_protected/_account/accounts/$accountId/orders/$orderId/success",
)({
  loader: async ({ params }) => {
    const [accountResult, orderResult] = await Promise.all([
      getAccount({ data: params.accountId }),
      getOrderRequest({ data: params.orderId }),
    ]);

    return {
      account: valueOrNotFound(unwrapOrThrow(accountResult)),
      order: valueOrNotFound(unwrapOrThrow(orderResult)),
    };
  },
  component: OrderSuccessPage,
});

function OrderSuccessPage() {
  const { accountId } = Route.useParams();
  const { order } = Route.useLoaderData();

  return <OrderSuccessView accountId={accountId} orderNumber={order.orderNumber} />;
}
