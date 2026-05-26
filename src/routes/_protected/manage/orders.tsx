import { createFileRoute } from "@tanstack/react-router";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/_protected/manage/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  return (
    <>
      <PageHeader title="Orders" />
      <PageContent>{null}</PageContent>
    </>
  );
}
