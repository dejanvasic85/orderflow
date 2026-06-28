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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { ProductRow } from "@/lib/products/schema";

type CatalogPickerDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: ProductRow[];
  itemProductIds: Set<string>;
  onAdd: (productId: string) => void;
  onRemove: (productId: string) => void;
};

type PickerAction = { kind: "add" } | { kind: "added" };

function resolveAction(productId: string, itemProductIds: Set<string>): PickerAction {
  if (itemProductIds.has(productId)) return { kind: "added" };
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
          className="text-red-700 dark:text-red-400"
          onClick={onRemove}
        >
          Remove
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
  itemProductIds,
  onAdd,
  onRemove,
}: CatalogPickerDrawerProps) {
  const [query, setQuery] = useState("");
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const panelSide = isDesktop ? "right" : "bottom";
  const panelClassName =
    "flex flex-col p-0 max-h-[85dvh] sm:max-h-none sm:h-full sm:w-[70vw] sm:min-w-[900px]";

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
        <SheetHeader className="shrink-0 border-b px-4 pb-3 pt-4 gap-3">
          <SheetTitle>Add item</SheetTitle>
          <SheetDescription className="sr-only">
            Browse and search the product catalog to add items to your order.
          </SheetDescription>
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 items-stretch">
              {filtered.map((product) => {
                const action = resolveAction(product.id, itemProductIds);
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
