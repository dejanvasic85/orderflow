import { Minus, Package, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { OrderRequestItemInput } from "@/lib/orderRequests/schema";
import type { ProductRow } from "@/lib/products/schema";

type DraftItemCardProps = {
  item: OrderRequestItemInput;
  product: ProductRow | undefined;
  onUpdate: (patch: { boxes?: number; extra_bottles?: number }) => void;
  onRemove: () => void;
};

export function DraftItemCard({ item, product, onUpdate, onRemove }: DraftItemCardProps) {
  const name = product?.name ?? item.product_id;
  const qtyPerBox = product?.qty_per_box ?? 1;
  const total = item.boxes * qtyPerBox + item.extra_bottles;

  return (
    <Card className="border-primary/30">
      <CardContent className="px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium leading-snug">{name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{qtyPerBox} per box</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <div className="flex flex-col items-end gap-1">
              <p className="text-xs text-muted-foreground">Boxes</p>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  aria-label="Decrease boxes"
                  onClick={() => onUpdate({ boxes: Math.max(0, item.boxes - 1) })}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-5 text-center text-sm font-medium">{item.boxes}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  aria-label="Increase boxes"
                  onClick={() => onUpdate({ boxes: item.boxes + 1 })}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <p className="text-xs text-muted-foreground">Bottles</p>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  aria-label="Decrease bottles"
                  onClick={() => onUpdate({ extra_bottles: Math.max(0, item.extra_bottles - 1) })}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-5 text-center text-sm font-medium">{item.extra_bottles}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  aria-label="Increase bottles"
                  onClick={() => onUpdate({ extra_bottles: item.extra_bottles + 1 })}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-sm font-semibold">{total}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              aria-label={`Remove ${name}`}
              onClick={onRemove}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
