import { Search } from "lucide-react";
import { useState } from "react";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { OrderRequestItemInput } from "@/lib/orderRequests/schema";
import type { ProductRow } from "@/lib/products/schema";

type CatalogPickerDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: ProductRow[];
  templateProductIds: Set<string>;
  draftItems: OrderRequestItemInput[];
  onAdd: (productId: string) => void;
  onRemove: (productId: string) => void;
};

type PickerAction = { kind: "in-template" } | { kind: "add" } | { kind: "added" };

function resolveAction(
  productId: string,
  templateProductIds: Set<string>,
  draftItems: OrderRequestItemInput[],
): PickerAction {
  if (templateProductIds.has(productId)) return { kind: "in-template" };
  if (draftItems.some((i) => i.product_id === productId)) return { kind: "added" };
  return { kind: "add" };
}

type CatalogPickerCardProps = {
  product: ProductRow;
  action: PickerAction;
  onAdd: () => void;
  onRemove: () => void;
};

function CatalogPickerCard({ product, action, onAdd, onRemove }: CatalogPickerCardProps) {
  let actionNode: React.ReactNode;
  switch (action.kind) {
    case "in-template":
      actionNode = <span className="text-xs text-muted-foreground">In your template</span>;
      break;
    case "add":
      actionNode = (
        <Button size="sm" variant="outline" onClick={onAdd}>
          Add
        </Button>
      );
      break;
    case "added":
      actionNode = (
        <Button
          size="sm"
          variant="secondary"
          className="text-green-700 dark:text-green-400"
          onClick={onRemove}
        >
          Added
        </Button>
      );
      break;
  }

  return <ProductCard product={product} action={actionNode} />;
}

export function CatalogPickerDrawer({
  open,
  onOpenChange,
  products,
  templateProductIds,
  draftItems,
  onAdd,
  onRemove,
}: CatalogPickerDrawerProps) {
  const [query, setQuery] = useState("");
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const panelSide = isDesktop ? "right" : "bottom";
  const panelClassName = "flex flex-col p-0 sm:w-[480px]";

  const trimmed = query.trim().toLowerCase();
  const filtered = trimmed
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(trimmed) ||
          (p.description ?? "").toLowerCase().includes(trimmed),
      )
    : products;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={panelSide} className={panelClassName}>
        <SheetHeader className="border-b px-4 pb-3 pt-4 gap-3">
          <SheetTitle>Add item</SheetTitle>
          <InputGroup>
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              aria-label="Search products"
              placeholder="Search products…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </InputGroup>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {filtered.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Search />
                </EmptyMedia>
                <EmptyTitle>No products found</EmptyTitle>
                <EmptyDescription>Try a different search term.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
              {filtered.map((product) => {
                const action = resolveAction(product.id, templateProductIds, draftItems);
                return (
                  <CatalogPickerCard
                    key={product.id}
                    product={product}
                    action={action}
                    onAdd={() => onAdd(product.id)}
                    onRemove={() => onRemove(product.id)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
