import { Package, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { ListSearchHeader } from "@/components/ListSearchHeader";
import { Paging } from "@/components/Paging";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import type { ProductRow } from "@/lib/products/schema";
import { ProductCard } from "./ProductCard";

type ProductCatalogProps = {
  products: ProductRow[];
  total: number;
  searchQuery: string;
  currentPage: number;
  totalPages: number;
  isLoading?: boolean;
  onSearchChange: (q: string) => void;
  onPageChange: (page: number) => void;
  onSelectProduct?: (product: ProductRow) => void;
};

const skeletonCardCount = 8;

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-[4/3] w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function ProductCatalog({
  products,
  total,
  searchQuery,
  currentPage,
  totalPages,
  isLoading = false,
  onSearchChange,
  onPageChange,
  onSelectProduct,
}: ProductCatalogProps) {
  const [inputValue, setInputValue] = useState(searchQuery);
  const debouncedInput = useDebounce(inputValue, 300);

  useEffect(() => {
    if (debouncedInput !== searchQuery) onSearchChange(debouncedInput);
  }, [debouncedInput]);

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  const showEmpty = !isLoading && products.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <ListSearchHeader
        value={inputValue}
        placeholder="Search products…"
        ariaLabel="Search products"
        countLabel={`${total} ${total === 1 ? "product" : "products"}`}
        onChange={setInputValue}
      />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 items-stretch">
          {Array.from({ length: skeletonCardCount }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : showEmpty ? (
        searchQuery ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No products found</EmptyTitle>
              <EmptyDescription>Try a different search term.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Package />
              </EmptyMedia>
              <EmptyTitle>No products available</EmptyTitle>
              <EmptyDescription>Products will appear here once they're added.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 items-stretch">
          {products.map((product) => {
            const action = !product.active ? (
              <Badge variant="outline" className="w-fit">
                Inactive
              </Badge>
            ) : undefined;
            return onSelectProduct ? (
              <button
                key={product.id}
                type="button"
                aria-label={`Edit ${product.name}`}
                className="h-full cursor-pointer text-left"
                onClick={() => onSelectProduct(product)}
              >
                <ProductCard product={product} action={action} />
              </button>
            ) : (
              <ProductCard key={product.id} product={product} action={action} />
            );
          })}
        </div>
      )}

      <Paging
        currentPage={currentPage}
        totalPages={totalPages}
        isLoading={isLoading}
        onPageChange={onPageChange}
      />
    </div>
  );
}
