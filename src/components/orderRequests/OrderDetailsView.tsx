import { ArrowLeft, Box, Calendar, MapPin, Package, User2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { OrderRequestWithItems } from "@/lib/orderRequests/schema";
import { formatOrderRef } from "@/lib/orderRequests/schema";
import { OrderItemCard } from "./OrderItemCard";

type OrderDetailsViewProps = {
  order: OrderRequestWithItems;
  placedByName: string;
  onBack: () => void;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, "0");
  const period = h >= 12 ? "pm" : "am";
  const hour = h % 12 || 12;
  return `${hour}:${m} ${period}`;
}

export function OrderDetailsView({ order, placedByName, onBack }: OrderDetailsViewProps) {
  const totalBoxes = order.order_request_items.reduce((sum, i) => sum + (i.boxes ?? 0), 0);
  const totalBottles = order.order_request_items.reduce(
    (sum, i) => sum + (i.extra_bottles ?? 0),
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline gap-3">
          <h2 className="font-mono text-2xl font-bold tracking-tight">
            {formatOrderRef(order.order_number)}
          </h2>
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            {formatDate(order.created_at)} at {formatTime(order.created_at)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetaTile icon={<User2 className="h-4 w-4" />} label="Placed by" value={placedByName} />
        <MetaTile
          icon={<Box className="h-4 w-4" />}
          label="Total boxes"
          value={String(totalBoxes)}
        />
        <MetaTile
          icon={<Package className="h-4 w-4" />}
          label="Extra bottles"
          value={String(totalBottles)}
        />
        <MetaTile
          icon={<Calendar className="h-4 w-4" />}
          label="Items"
          value={String(order.order_request_items.length)}
        />
      </div>

      {(order.delivery_address || order.delivery_instructions) && (
        <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 flex gap-3">
          <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
          <div className="flex flex-col gap-0.5">
            {order.delivery_address && (
              <p className="text-sm font-medium">{order.delivery_address}</p>
            )}
            {order.delivery_instructions && (
              <p className="text-sm text-muted-foreground">{order.delivery_instructions}</p>
            )}
          </div>
        </div>
      )}

      <Separator />

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Items ordered
        </h3>
        <div className="flex flex-col gap-2">
          {order.order_request_items.map((item) => (
            <OrderItemCard
              key={item.id}
              readOnly
              name={item.products?.name ?? "Unknown product"}
              qtyPerBox={item.products?.qty_per_box ?? 0}
              boxes={item.boxes ?? 0}
              bottles={item.extra_bottles ?? 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

type MetaTileProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

function MetaTile({ icon, label, value }: MetaTileProps) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border/60 bg-card px-4 py-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-semibold truncate">{value}</p>
    </div>
  );
}
