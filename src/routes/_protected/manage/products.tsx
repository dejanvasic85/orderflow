import {
  createFileRoute,
  useNavigate,
  useRouteContext,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { WhenAllowed } from "@/components/auth/WhenAllowed";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProductCatalog } from "@/components/products/ProductCatalog";
import { ProductEditPanel } from "@/components/products/ProductEditPanel";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useDelayedBoolean } from "@/hooks/use-delayed-boolean";
import { useMediaQuery } from "@/hooks/use-media-query";
import { can, permissions } from "@/lib/permissions";
import { createProduct, listPagedProducts, updateProduct } from "@/lib/products/products.functions";
import type {
  CreateProductInput,
  PagedProductsResult,
  Product,
  UpdateProductInput,
} from "@/lib/products/schema";
import { listProductsSearchSchema, productPageSize } from "@/lib/products/schema";
import { asResult } from "@/lib/result";

export const Route = createFileRoute("/_protected/manage/products")({
  validateSearch: listProductsSearchSchema,
  loaderDeps: ({ search }) => ({ q: search.q, page: search.page }),
  loader: async ({ deps }) => {
    const result = asResult<PagedProductsResult>(
      await listPagedProducts({ data: { q: deps.q, page: deps.page, includeInactive: true } }),
    );
    if (!result.ok) throw new Error(result.error.message);
    return { products: result.value.products, total: result.value.total };
  },
  component: ProductsPage,
});

function ProductsPage() {
  const { products: loadedProducts, total } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const routerLoading = useRouterState({ select: (s) => s.isLoading });
  const isLoading = useDelayedBoolean(routerLoading);
  const { user } = useRouteContext({ from: "/_protected" });
  const canWriteProducts = can(user.user_role, permissions.products.write);

  const [products, setProducts] = useState<Product[]>(loadedProducts);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setProducts(loadedProducts);
  }, [loadedProducts]);

  const selectedProduct = products.find((p) => p.id === selectedId) ?? null;
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const panelSide = isDesktop ? "right" : "bottom";
  const panelClassName = "overflow-y-auto p-0 sm:w-[50vw] sm:min-w-[800px]";

  const searchQuery = search.q ?? "";
  const currentPage = search.page ?? 1;
  const totalPages = Math.ceil(total / productPageSize);

  function handleSearchChange(q: string) {
    void navigate({
      to: "/manage/products",
      search: { q: q || undefined, page: undefined },
      replace: true,
    });
  }

  function handlePageChange(page: number) {
    void navigate({
      to: "/manage/products",
      search: { q: search.q, page: page === 1 ? undefined : page },
      replace: true,
    });
  }

  function handleSelectProduct(product: Product) {
    setSelectedId(product.id);
    setCreating(false);
  }

  function handleStartCreate() {
    setSelectedId(null);
    setCreating(true);
  }

  function handleDiscard() {
    setSelectedId(null);
    setCreating(false);
  }

  async function handleSave(payload: UpdateProductInput) {
    const result = asResult<Product>(await updateProduct({ data: payload }));
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    setSelectedId(null);
    toast.success("Changes saved");
    void router.invalidate();
  }

  async function handleCreate(payload: CreateProductInput) {
    const result = asResult<Product>(await createProduct({ data: payload }));
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    setCreating(false);
    toast.success(`Product "${result.value.name}" created`);
    void router.invalidate();
  }

  return (
    <>
      <PageHeader
        title="Products"
        actions={
          <WhenAllowed permission={permissions.products.write}>
            <Button onClick={handleStartCreate}>+ New product</Button>
          </WhenAllowed>
        }
      />
      <PageContent>
        <ProductCatalog
          products={products}
          total={total}
          searchQuery={searchQuery}
          currentPage={currentPage}
          totalPages={totalPages}
          isLoading={isLoading}
          onSearchChange={handleSearchChange}
          onPageChange={handlePageChange}
          onSelectProduct={canWriteProducts ? handleSelectProduct : undefined}
        />

        <Sheet open={!!selectedProduct} onOpenChange={(open) => !open && handleDiscard()}>
          <SheetContent side={panelSide} className={panelClassName}>
            <SheetHeader className="sr-only">
              <SheetTitle>Product details</SheetTitle>
              <SheetDescription>View and edit product details</SheetDescription>
            </SheetHeader>
            {selectedProduct && (
              <ProductEditPanel
                key={selectedProduct.id}
                product={selectedProduct}
                onSave={handleSave}
                onDiscard={handleDiscard}
              />
            )}
          </SheetContent>
        </Sheet>

        <Sheet open={creating} onOpenChange={(open) => !open && handleDiscard()}>
          <SheetContent side={panelSide} className={panelClassName}>
            <SheetHeader className="sr-only">
              <SheetTitle>New product</SheetTitle>
              <SheetDescription>Add a new product to the catalog</SheetDescription>
            </SheetHeader>
            {creating && (
              <ProductEditPanel mode="create" onSave={handleCreate} onDiscard={handleDiscard} />
            )}
          </SheetContent>
        </Sheet>
      </PageContent>
    </>
  );
}
