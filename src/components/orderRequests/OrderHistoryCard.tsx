import { ArrowRight, Box, Package, User2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrderHistoryItem } from "@/lib/orderRequests/orderRequests.server";
import { formatOrderRef } from "@/lib/orderRequests/schema";

type OrderHistoryCardProps = {
  order: OrderHistoryItem;
  onView?: (orderId: string) => void;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    requested: {
      label: "Requested",
      className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    },
    submitted: {
      label: "Submitted",
      className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    },
    processing: {
      label: "Processing",
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    },
    completed: {
      label: "Completed",
      className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
    },
  };

  const config = variants[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

export function OrderHistoryCard({ order, onView }: OrderHistoryCardProps) {
  return (
    <div className="group relative flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-all duration-200 hover:border-border hover:shadow-md sm:flex-row sm:items-center sm:gap-4">
      <div className="flex items-center gap-3 sm:w-32 sm:shrink-0 sm:flex-col sm:items-start sm:gap-1">
        <span className="font-mono text-sm font-semibold tracking-tight text-foreground">
          {formatOrderRef(order.order_number)}
        </span>
        <StatusBadge status={order.status} />
      </div>

      <div className="flex flex-1 flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <User2 className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{order.placed_by_name}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Box className="h-3.5 w-3.5 shrink-0" />
            <span>
              <span className="font-medium text-foreground">{order.total_boxes}</span>
              {" boxes"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Package className="h-3.5 w-3.5 shrink-0" />
            <span>
              <span className="font-medium text-foreground">{order.total_bottles}</span>
              {" bottles"}
            </span>
          </div>
        </div>

        <span className="text-xs text-muted-foreground/70">{formatDate(order.created_at)}</span>
      </div>

      <div className="flex justify-end sm:shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          onClick={() => onView?.(order.id)}
        >
          View order
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
        </Button>
      </div>
    </div>
  );
}
