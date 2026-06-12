import { ClipboardList, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Paging } from "@/components/Paging";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import type { OrderHistoryItem } from "@/lib/orderRequests/schema";
import { OrderHistoryCard } from "./OrderHistoryCard";

type OrderHistoryListProps = {
  orders: OrderHistoryItem[];
  buildViewHref?: (orderId: string) => string;
  searchQuery?: string;
  currentPage?: number;
  totalPages?: number;
  isLoading?: boolean;
  onSearchChange?: (q: string) => void;
  onPageChange?: (page: number) => void;
};

export function OrderHistoryList({
  orders,
  buildViewHref,
  searchQuery = "",
  currentPage = 1,
  totalPages = 1,
  isLoading = false,
  onSearchChange,
  onPageChange,
}: OrderHistoryListProps) {
  const [inputValue, setInputValue] = useState(searchQuery);
  const debouncedInput = useDebounce(inputValue, 300);

  useEffect(() => {
    onSearchChange?.(debouncedInput);
  }, [debouncedInput]);

  return (
    <div className="flex flex-col gap-4">
      {onSearchChange && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by order number…"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </div>
      )}

      {orders.length === 0 ? (
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
      ) : (
        <div className="flex flex-col gap-2">
          {orders.map((order) => (
            <OrderHistoryCard key={order.id} order={order} viewHref={buildViewHref?.(order.id)} />
          ))}
        </div>
      )}

      {onPageChange && (
        <Paging
          currentPage={currentPage}
          totalPages={totalPages}
          isLoading={isLoading}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
