import { ClipboardList } from "lucide-react";
import type { OrderHistoryItem } from "@/lib/orderRequests/orderRequests.server";
import { OrderHistoryCard } from "./OrderHistoryCard";

type OrderHistoryListProps = {
  orders: OrderHistoryItem[];
  onViewOrder?: (orderId: string) => void;
};

export function OrderHistoryList({ orders, onViewOrder }: OrderHistoryListProps) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <ClipboardList className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-foreground">No orders yet</p>
          <p className="text-xs text-muted-foreground">
            Orders placed for this account will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {orders.map((order) => (
        <OrderHistoryCard key={order.id} order={order} onView={onViewOrder} />
      ))}
    </div>
  );
}
