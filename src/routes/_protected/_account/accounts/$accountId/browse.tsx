import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProductCatalog } from "@/components/products/ProductCatalog";
import { useDelayedBoolean } from "@/hooks/use-delayed-boolean";
import { listPagedProducts } from "@/lib/products/products.functions";
import type { PagedProductsResult } from "@/lib/products/schema";
import { listProductsSearchSchema, productPageSize } from "@/lib/products/schema";
import { asResult } from "@/lib/result";
import { unwrapOrThrow } from "@/lib/resultLoader";

export const Route = createFileRoute("/_protected/_account/accounts/$accountId/browse")({
  validateSearch: listProductsSearchSchema,
  loaderDeps: ({ search }) => ({ q: search.q, page: search.page }),
  loader: async ({ deps }) => {
    const result = asResult<PagedProductsResult>(
      await listPagedProducts({ data: { q: deps.q, page: deps.page } }),
    );
    const { products, total } = unwrapOrThrow(result);
    return { products, total };
  },
  component: BrowsePage,
});

function BrowsePage() {
  const { products, total } = Route.useLoaderData();
  const { accountId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const routerLoading = useRouterState({ select: (s) => s.isLoading });
  const isLoading = useDelayedBoolean(routerLoading);

  const totalPages = Math.ceil(total / productPageSize);

  function handleSearchChange(q: string) {
    void navigate({
      to: "/accounts/$accountId/browse",
      params: { accountId },
      search: { q: q || undefined, page: undefined },
      replace: true,
    });
  }

  function handlePageChange(page: number) {
    void navigate({
      to: "/accounts/$accountId/browse",
      params: { accountId },
      search: { q: search.q, page: page === 1 ? undefined : page },
      replace: true,
    });
  }

  return (
    <>
      <PageHeader title="Browse" description="Explore our product catalog" />
      <PageContent>
        <ProductCatalog
          products={products}
          total={total}
          searchQuery={search.q ?? ""}
          currentPage={search.page ?? 1}
          totalPages={totalPages}
          isLoading={isLoading}
          onSearchChange={handleSearchChange}
          onPageChange={handlePageChange}
        />
      </PageContent>
    </>
  );
}
