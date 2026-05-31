import type { OrderRequestItemInput } from "@/lib/orderRequests/schema";
import type { ProductRow } from "@/lib/products/schema";
import { DraftItemCard } from "./DraftItemCard";

type DraftItemsListProps = {
  items: OrderRequestItemInput[];
  products: ProductRow[];
  onUpdate: (productId: string, patch: { boxes?: number; extra_bottles?: number }) => void;
  onRemove: (productId: string) => void;
};

export function DraftItemsList({ items, products, onUpdate, onRemove }: DraftItemsListProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xl font-semibold tracking-tight">Additional items</h2>
      {items.map((item) => {
        const product = products.find((p) => p.id === item.product_id);
        return (
          <DraftItemCard
            key={item.product_id}
            item={item}
            product={product}
            onUpdate={(patch) => onUpdate(item.product_id, patch)}
            onRemove={() => onRemove(item.product_id)}
          />
        );
      })}
    </div>
  );
}
