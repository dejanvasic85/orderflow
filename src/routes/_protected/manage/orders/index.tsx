import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { OrderHistoryList } from "@/components/orderRequests/OrderHistoryList";
import { NavButton } from "@/components/ui/NavButton";
import { useDelayedBoolean } from "@/hooks/use-delayed-boolean";
import { listAllOrders } from "@/lib/orderRequests/orderRequests.functions";
import {
  listOrdersSearchSchema,
  orderPageSize,
  type PagedOrdersResult,
} from "@/lib/orderRequests/schema";
import { asResult } from "@/lib/result";

export const Route = createFileRoute("/_protected/manage/orders/")({
  validateSearch: listOrdersSearchSchema,
  loaderDeps: ({ search }) => ({ q: search.q, page: search.page }),
  loader: async ({ deps }) => {
    const result = asResult<PagedOrdersResult>(
      await listAllOrders({ data: { q: deps.q, page: deps.page } }),
    );
    if (!result.ok) throw new Error(result.error.message);
    return { orders: result.value.orders, total: result.value.total };
  },
  component: OrdersPage,
});

function OrdersPage() {
  const { orders, total } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const routerLoading = useRouterState({ select: (s) => s.isLoading });
  const isLoading = useDelayedBoolean(routerLoading);

  const searchQuery = search.q ?? "";
  const currentPage = search.page ?? 1;
  const totalPages = Math.ceil(total / orderPageSize);

  function handleSearchChange(q: string) {
    const normalized = q.trim();
    void navigate({
      to: "/manage/orders",
      search: { q: normalized || undefined, page: undefined },
      replace: true,
    });
  }

  function handlePageChange(page: number) {
    void navigate({
      to: "/manage/orders",
      search: { q: search.q, page: page === 1 ? undefined : page },
      replace: true,
    });
  }

  return (
    <>
      <PageHeader
        title="Orders"
        actions={<NavButton to="/manage/orders/new">+ New order</NavButton>}
      />
      <PageContent>
        <OrderHistoryList
          orders={orders}
          total={total}
          buildViewHref={(orderId) => `/manage/orders/${orderId}`}
          buildReorderHref={(order) =>
            order.accountId
              ? `/manage/orders/new?accountId=${order.accountId}&fromOrderId=${order.id}`
              : `/manage/orders/new?fromOrderId=${order.id}`
          }
          searchQuery={searchQuery}
          currentPage={currentPage}
          totalPages={totalPages}
          isLoading={isLoading}
          onSearchChange={handleSearchChange}
          onPageChange={handlePageChange}
        />
      </PageContent>
    </>
  );
}
