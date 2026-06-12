import { ClipboardList, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Paging } from "@/components/Paging";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { useDebounce } from "@/hooks/use-debounce";
import type { OrderHistoryItem } from "@/lib/orderRequests/schema";
import { OrderHistoryCard } from "./OrderHistoryCard";

type OrderHistoryListProps = {
  orders: OrderHistoryItem[];
  total?: number;
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
  total,
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
    setInputValue(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (!onSearchChange) return;
    if (debouncedInput === searchQuery) return;
    onSearchChange(debouncedInput);
  }, [debouncedInput, onSearchChange, searchQuery]);

  return (
    <div className="flex flex-col gap-4">
      {onSearchChange && (
        <div className="flex items-center gap-3">
          <InputGroup className="max-w-sm">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              aria-label="Search orders"
              placeholder="Search by order number…"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </InputGroup>
          {total !== undefined && (
            <span className="text-sm text-muted-foreground">
              {total} {total === 1 ? "order" : "orders"}
            </span>
          )}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            {searchQuery ? (
              <>
                <p className="text-sm font-medium text-foreground">
                  No results for "{searchQuery}"
                </p>
                <p className="text-xs text-muted-foreground">Try a different search term.</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-foreground">No orders yet</p>
                <p className="text-xs text-muted-foreground">
                  Orders placed for this account will appear here.
                </p>
              </>
            )}
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
