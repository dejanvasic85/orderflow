import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Plus } from "lucide-react";
import {
  mockCustomerAccounts,
  mockOrders,
  currentViewerUserId,
} from "@/components/customer/mockData";
import { OrderCard } from "@/components/customer/OrderCard";
import { PageContent } from "@/components/layout/PageContent";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/_protected/_app/accounts/$accountId/orders")({
  loader: ({ params }) => {
    const account = mockCustomerAccounts.find((a) => a.id === params.accountId);
    if (!account) throw notFound();
    const orders = mockOrders
      .filter((o) => o.accountId === params.accountId)
      .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
    return { account, orders };
  },
  component: AccountOrdersPage,
});

function AccountOrdersPage() {
  const { account, orders } = Route.useLoaderData();

  return (
    <>
      <div className="flex items-center px-6 py-4 gap-3">
        <Link
          to="/accounts"
          className="md:hidden flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <ArrowLeft className="size-4" />
          Accounts
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">{account.name}</h1>
      </div>
      <Separator />
      <PageContent>
        <div className="mx-auto w-full max-w-2xl flex flex-col gap-3">
          {orders.length > 0 ? (
            <>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground px-1">
                Orders
              </p>
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  showPlacedBy={order.placedByUserId !== currentViewerUserId}
                />
              ))}
            </>
          ) : (
            <p className="text-sm text-muted-foreground px-1">No orders yet.</p>
          )}

          <div className="pt-2">
            <Button className="w-full" variant="outline" size="lg">
              <Plus className="size-4" />
              New order
            </Button>
          </div>
        </div>
      </PageContent>
    </>
  );
}
