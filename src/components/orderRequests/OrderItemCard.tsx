import { Minus, Package, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type OrderItemCardProps =
  | {
      readOnly: true;
      name: string;
      qtyPerBox: number;
      boxes: number;
      bottles: number;
    }
  | {
      readOnly?: false;
      name: string;
      qtyPerBox: number;
      boxes: number;
      bottles: number;
      onUpdate: (patch: { boxes?: number; extra_bottles?: number }) => void;
      onRemove: () => void;
    };

export function OrderItemCard(props: OrderItemCardProps) {
  const { name, qtyPerBox, boxes, bottles } = props;
  const total = boxes * qtyPerBox + bottles;

  return (
    <Card className={props.readOnly ? "border-border/60" : "border-primary/30"}>
      <CardContent className="px-4 py-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${props.readOnly ? "bg-muted" : "bg-primary/10"}`}
            >
              <Package
                className={`h-4 w-4 ${props.readOnly ? "text-muted-foreground" : "text-primary"}`}
              />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium leading-snug">{name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{qtyPerBox} per box</p>
            </div>
          </div>
          {!props.readOnly && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
              aria-label={`Remove ${name}`}
              onClick={props.onRemove}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <div className="mt-3 flex w-full items-center justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Boxes</p>
            {props.readOnly ? (
              <p className="text-sm font-medium">{boxes}</p>
            ) : (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  aria-label="Decrease boxes"
                  onClick={() => props.onUpdate({ boxes: Math.max(0, boxes - 1) })}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-5 text-center text-sm font-medium">{boxes}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  aria-label="Increase boxes"
                  onClick={() => props.onUpdate({ boxes: boxes + 1 })}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Bottles</p>
            {props.readOnly ? (
              <p className="text-sm font-medium">{bottles}</p>
            ) : (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  aria-label="Decrease bottles"
                  onClick={() => props.onUpdate({ extra_bottles: Math.max(0, bottles - 1) })}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-5 text-center text-sm font-medium">{bottles}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  aria-label="Increase bottles"
                  onClick={() => props.onUpdate({ extra_bottles: bottles + 1 })}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="pt-1 text-sm font-semibold">{total}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
