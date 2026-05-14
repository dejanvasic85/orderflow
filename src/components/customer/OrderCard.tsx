import { cn } from "@/lib/utils";
import type { MockOrder } from "./mockData";

type OrderCardProps = {
  order: MockOrder;
  showPlacedBy: boolean;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function OrderCard({ order, showPlacedBy }: OrderCardProps) {
  const bottleLabel = order.totalBottles === 1 ? "bottle" : "bottles";

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-2xl border bg-card px-5 py-4",
        "transition-colors hover:bg-accent/50 cursor-pointer",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="font-semibold tracking-tight">#{order.orderNumber}</span>
        <span className="text-sm text-muted-foreground shrink-0">{formatDate(order.placedAt)}</span>
      </div>
      <p className="text-sm text-muted-foreground">
        {order.summary} · {order.totalBottles} {bottleLabel}
      </p>
      {showPlacedBy && (
        <p className="text-xs text-muted-foreground/70">Placed by {order.placedByName}</p>
      )}
    </div>
  );
}
