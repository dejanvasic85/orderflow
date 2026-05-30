import { createFileRoute } from "@tanstack/react-router";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProductCatalog } from "@/components/products/ProductCatalog";
import { listProducts } from "@/lib/products/products.functions";
import type { ProductRow } from "@/lib/products/schema";
import { asResult } from "@/lib/result";

export const Route = createFileRoute("/_protected/_account/accounts/$accountId/browse")({
  loader: async () => {
    const result = asResult<ProductRow[]>(await listProducts());
    if (!result.ok) throw new Error(result.error.message);
    return { products: result.value };
  },
  component: BrowsePage,
});

function BrowsePage() {
  const { products } = Route.useLoaderData();
  return (
    <>
      <PageHeader title="Browse" description="Explore our product catalog" />
      <PageContent>
        <ProductCatalog products={products} />
      </PageContent>
    </>
  );
}
