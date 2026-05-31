import { Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { TemplateItem } from "@/lib/templates/schema";

type TemplateItemCardProps = {
  item: TemplateItem;
};

export function TemplateItemCard({ item }: TemplateItemCardProps) {
  const total = item.box_count * item.products.qty_per_box + item.bottle_count;

  return (
    <Card className="border-border/60">
      <CardContent className="px-4 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium leading-snug">{item.products.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {item.products.qty_per_box} per box
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-start gap-6 text-sm">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Boxes</p>
              <p className="font-medium">{item.box_count}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Bottles</p>
              <p className="font-medium">{item.bottle_count}</p>
            </div>
            <div className="w-8 text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-semibold">{total}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
