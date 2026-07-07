import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedTotal } from "./AnimatedTotal";
import { ProductThumbnail } from "./ProductThumbnail";
import { QuantityStepper } from "./QuantityStepper";

type OrderItemCardProps =
  | {
      readOnly: true;
      name: string;
      imageUrl: string | null;
      qtyPerBox: number;
      boxes: number;
      units: number;
    }
  | {
      readOnly?: false;
      name: string;
      imageUrl: string | null;
      qtyPerBox: number;
      boxes: number;
      units: number;
      onUpdate: (patch: { boxes?: number; extraUnits?: number }) => void;
      onRemove: () => void;
    };

function ReadOnlyStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

export function OrderItemCard(props: OrderItemCardProps) {
  const { name, imageUrl, qtyPerBox, boxes, units } = props;
  const total = boxes * qtyPerBox + units;

  return (
    <Card className={props.readOnly ? "border-border/60" : "border-primary/30"}>
      <CardContent className="flex flex-col gap-4 px-4 py-3">
        <div className="flex items-start gap-3">
          <ProductThumbnail
            imageUrl={imageUrl}
            name={name}
            className={props.readOnly ? "size-11" : "size-14"}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium leading-snug">{name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{qtyPerBox} per box</p>
          </div>
          {!props.readOnly && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
              aria-label={`Remove ${name}`}
              onClick={props.onRemove}
            >
              <Trash2 />
            </Button>
          )}
        </div>

        <div className="flex items-end justify-between gap-3">
          {props.readOnly ? (
            <div className="flex items-end gap-6">
              <ReadOnlyStat label="Boxes" value={boxes} />
              <ReadOnlyStat label="Units" value={units} />
            </div>
          ) : (
            <div className="flex flex-wrap items-end gap-3">
              <QuantityStepper
                label="Boxes"
                value={boxes}
                onChange={(next) => props.onUpdate({ boxes: next })}
              />
              <QuantityStepper
                label="Units"
                value={units}
                onChange={(next) => props.onUpdate({ extraUnits: next })}
              />
            </div>
          )}
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-xs text-muted-foreground">Total</span>
            <AnimatedTotal
              value={total}
              aria-label={`Total ${total}`}
              className="text-lg font-semibold tabular-nums"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
