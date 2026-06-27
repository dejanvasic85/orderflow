import { AnimatePresence, motion } from "framer-motion";
import type { OrderRequestItemInput } from "@/lib/orderRequests/schema";
import type { ProductRow } from "@/lib/products/schema";
import { OrderItemCard } from "./OrderItemCard";

type DraftItemsListProps = {
  items: OrderRequestItemInput[];
  products: ProductRow[];
  onUpdate: (productId: string, patch: { boxes?: number; extra_units?: number }) => void;
  onRemove: (productId: string) => void;
};

export function DraftItemsList({ items, products, onUpdate, onRemove }: DraftItemsListProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold tracking-tight">Additional items</h2>
      <AnimatePresence initial={false}>
        {items.map((item) => {
          const product = products.find((p) => p.id === item.product_id);
          return (
            <motion.div
              key={item.product_id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden p-px"
            >
              <OrderItemCard
                name={product?.name ?? item.product_id}
                qtyPerBox={product?.qty_per_box ?? 1}
                boxes={item.boxes}
                units={item.extra_units}
                onUpdate={(patch) => onUpdate(item.product_id, patch)}
                onRemove={() => onRemove(item.product_id)}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
