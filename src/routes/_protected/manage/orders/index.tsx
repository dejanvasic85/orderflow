import { createFileRoute } from "@tanstack/react-router";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { OrderHistoryList } from "@/components/orderRequests/OrderHistoryList";
import { listAllOrders } from "@/lib/orderRequests/orderRequests.functions";
import type { OrderHistoryItem } from "@/lib/orderRequests/orderRequests.server";
import { asResult } from "@/lib/result";

export const Route = createFileRoute("/_protected/manage/orders/")({
  loader: async () => {
    const result = asResult<OrderHistoryItem[]>(await listAllOrders());
    if (!result.ok) throw new Error(result.error.message);
    return { orders: result.value };
  },
  component: OrdersPage,
});

function OrdersPage() {
  const { orders } = Route.useLoaderData();

  return (
    <>
      <PageHeader title="Orders" />
      <PageContent>
        <OrderHistoryList
          orders={orders}
          buildViewHref={(orderId) => `/manage/orders/${orderId}`}
        />
      </PageContent>
    </>
  );
}
