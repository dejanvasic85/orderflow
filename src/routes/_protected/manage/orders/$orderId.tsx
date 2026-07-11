import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { OrderDetailsView } from "@/components/orderRequests/OrderDetailsView";
import { getOrderRequestAsAdminOrStaff } from "@/lib/orderRequests/orderRequests.functions";
import { unwrapOrThrow, valueOrNotFound } from "@/lib/resultLoader";

export const Route = createFileRoute("/_protected/manage/orders/$orderId")({
  loader: async ({ params }) => {
    const result = await getOrderRequestAsAdminOrStaff({ data: params.orderId });
    return { order: valueOrNotFound(unwrapOrThrow(result)) };
  },
  component: AdminOrderDetailsPage,
});

function AdminOrderDetailsPage() {
  const { order } = Route.useLoaderData();
  const navigate = useNavigate();

  function handleBack() {
    void navigate({ to: "/manage/orders" });
  }

  function handleReorder() {
    if (!order.accountId) return;
    void navigate({
      to: "/manage/orders/new",
      search: { accountId: order.accountId, fromOrderId: order.id },
    });
  }

  const placedByName = order.user?.name ?? "Unknown";
  const accountName = order.account?.name ?? "Order";

  return (
    <>
      <PageHeader title={accountName} />
      <PageContent>
        <OrderDetailsView
          order={order}
          placedByName={placedByName}
          onBack={handleBack}
          onReorder={order.accountId ? handleReorder : undefined}
        />
      </PageContent>
    </>
  );
}
