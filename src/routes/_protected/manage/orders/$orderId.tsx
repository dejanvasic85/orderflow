import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { OrderDetailsView } from "@/components/orderRequests/OrderDetailsView";
import { getOrderRequestAsAdminOrStaff } from "@/lib/orderRequests/orderRequests.functions";
import type { OrderRequestWithItems } from "@/lib/orderRequests/schema";
import { formatOrderRef } from "@/lib/orderRequests/schema";

export const Route = createFileRoute("/_protected/manage/orders/$orderId")({
  loader: async ({ params }) => {
    const result = await getOrderRequestAsAdminOrStaff({ data: params.orderId });
    if (!result.ok) throw new Error(result.error.message);
    if (!result.value) throw notFound();
    return { order: result.value as OrderRequestWithItems };
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
    if (!order.account_id) return;
    void navigate({
      to: "/manage/orders/new",
      search: { accountId: order.account_id, fromOrderId: order.id },
    });
  }

  const placedByName = order.users?.name ?? "Unknown";
  const accountName = order.accounts?.name;

  return (
    <>
      <PageHeader title={formatOrderRef(order.order_number)} description={accountName} />
      <PageContent>
        <OrderDetailsView
          order={order}
          placedByName={placedByName}
          onBack={handleBack}
          onReorder={order.account_id ? handleReorder : undefined}
        />
      </PageContent>
    </>
  );
}
