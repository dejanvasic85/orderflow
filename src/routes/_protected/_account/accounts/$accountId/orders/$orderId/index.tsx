import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { OrderDetailsView } from "@/components/orderRequests/OrderDetailsView";
import { getAccount } from "@/lib/accounts/accounts.functions";
import { getOrderRequest } from "@/lib/orderRequests/orderRequests.functions";
import { unwrapOrThrow, valueOrNotFound } from "@/lib/resultLoader";

export const Route = createFileRoute("/_protected/_account/accounts/$accountId/orders/$orderId/")({
  loader: async ({ params }) => {
    const [accountResult, orderResult] = await Promise.all([
      getAccount({ data: params.accountId }),
      getOrderRequest({ data: params.orderId }),
    ]);

    const account = valueOrNotFound(unwrapOrThrow(accountResult));
    const order = valueOrNotFound(unwrapOrThrow(orderResult));
    if (order.accountId !== params.accountId) throw notFound();

    return {
      account,
      order,
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

  function handleReorder() {
    void navigate({
      to: "/accounts/$accountId/orders/new",
      params: { accountId },
      search: { fromOrderId: order.id },
    });
  }

  const placedByName = order.user?.name ?? "Unknown";

  return (
    <>
      <PageHeader title={account.name} />
      <PageContent>
        <OrderDetailsView
          order={order}
          placedByName={placedByName}
          onBack={handleBack}
          onReorder={handleReorder}
        />
      </PageContent>
    </>
  );
}
