import { AnimatePresence, motion } from "framer-motion";
import type { OrderRequestItemInput } from "@/lib/orderRequests/schema";
import type { Product } from "@/lib/products/schema";
import { OrderItemCard } from "./OrderItemCard";

type OrderItemsListProps = {
  items: OrderRequestItemInput[];
  products: Product[];
  onUpdate: (productId: string, patch: { boxes?: number; extraUnits?: number }) => void;
  onRemove: (productId: string) => void;
};

export function OrderItemsList({ items, products, onUpdate, onRemove }: OrderItemsListProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence initial={false}>
        {items.map((item) => {
          const product = products.find((p) => p.id === item.productId);
          return (
            <motion.div
              key={item.productId}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden p-px"
            >
              <OrderItemCard
                name={product?.name ?? item.productId}
                imageUrl={product?.imageUrl ?? null}
                qtyPerBox={product?.qtyPerBox ?? 1}
                boxes={item.boxes}
                units={item.extraUnits}
                onUpdate={(patch) => onUpdate(item.productId, patch)}
                onRemove={() => onRemove(item.productId)}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
