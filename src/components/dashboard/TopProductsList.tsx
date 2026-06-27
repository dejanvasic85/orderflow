import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import type { TopProduct } from "@/lib/dashboard/schema";

type TopProductsListProps = {
  products: TopProduct[];
};

export function TopProductsList({ products }: TopProductsListProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col gap-3 rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <p className="font-medium">Top products</p>
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No data yet</EmptyTitle>
            <EmptyDescription>Products will appear as orders come in.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const maxVolume = products[0]?.volume ?? 1;

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-card p-6 ring-1 ring-foreground/10">
      <div>
        <p className="font-medium">Top products</p>
        <p className="text-sm text-muted-foreground">By units ordered, last 3 months</p>
      </div>
      <ol className="flex flex-col gap-3">
        {products.map((product, index) => (
          <li key={product.productId} className="flex items-center gap-3">
            <span className="w-4 shrink-0 text-right text-xs font-medium text-muted-foreground">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{product.name}</span>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {product.volume.toLocaleString()}
                </span>
              </div>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground/60"
                  style={{ width: `${Math.round((product.volume / maxVolume) * 100)}%` }}
                />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
