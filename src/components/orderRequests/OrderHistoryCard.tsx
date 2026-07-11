import {
  ArrowRight,
  BottleWine,
  Box,
  Building2,
  CalendarDays,
  RefreshCw,
  User2,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatShortDate } from "@/lib/dates";
import type { OrderHistoryItem } from "@/lib/orderRequests/schema";
import { formatOrderRef } from "@/lib/orderRequests/schema";
import { cn } from "@/lib/utils";

type OrderHistoryCardProps = {
  order: OrderHistoryItem;
  viewHref?: string;
  reorderHref?: string;
};

export function OrderHistoryCard({ order, viewHref, reorderHref }: OrderHistoryCardProps) {
  return (
    <div className="group relative flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-all duration-200 hover:border-border hover:shadow-md sm:flex-row sm:items-center sm:gap-5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 sm:w-36 sm:shrink-0 sm:flex-col sm:items-start sm:justify-start">
        <span className="font-mono text-sm font-semibold tracking-tight text-foreground">
          {formatOrderRef(order.orderNumber)}
        </span>
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          <CalendarDays className="size-3 shrink-0" />
          {formatShortDate(order.createdAt)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
        {order.accountName && (
          <MetaItem icon={<Building2 className="size-4 shrink-0" />}>
            <span className="truncate font-medium text-foreground">{order.accountName}</span>
          </MetaItem>
        )}
        <MetaItem icon={<User2 className="size-4 shrink-0" />}>
          {order.placedByOrgName ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-default truncate">{order.placedByName}</span>
              </TooltipTrigger>
              <TooltipContent>{order.placedByOrgName}</TooltipContent>
            </Tooltip>
          ) : (
            <span className="truncate">{order.placedByName}</span>
          )}
        </MetaItem>

        <div className="flex items-center gap-x-6 sm:contents">
          <MetaItem icon={<Box className="size-4 shrink-0" />}>
            <span className="font-medium text-foreground tabular-nums">{order.totalBoxes}</span>
            <span>boxes</span>
          </MetaItem>
          <MetaItem icon={<BottleWine className="size-4 shrink-0" />}>
            <span className="font-medium text-foreground tabular-nums">{order.totalUnits}</span>
            <span>units</span>
          </MetaItem>
        </div>
      </div>

      {(viewHref || reorderHref) && (
        <div className="flex items-center justify-between gap-3 sm:shrink-0 sm:justify-end">
          {reorderHref && (
            <a
              href={reorderHref}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <RefreshCw className="size-3.5" />
              Re-order
            </a>
          )}
          {viewHref && (
            <a
              href={viewHref}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View order
              <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

type MetaItemProps = {
  icon: React.ReactNode;
  children: React.ReactNode;
};

function MetaItem({ icon, children }: MetaItemProps) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
      {icon}
      <span className="inline-flex min-w-0 items-center gap-1 truncate">{children}</span>
    </div>
  );
}
