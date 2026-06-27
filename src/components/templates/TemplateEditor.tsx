import { Link } from "@tanstack/react-router";
import { ArrowLeft, Plus } from "lucide-react";
import { useReducer, useState } from "react";
import { CatalogPickerDrawer } from "@/components/orderRequests/CatalogPickerDrawer";
import { DraftItemsList } from "@/components/orderRequests/DraftItemsList";
import { OrderItemCard } from "@/components/orderRequests/OrderItemCard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Account } from "@/lib/accounts/schema";
import type { OrderRequestItemInput } from "@/lib/orderRequests/schema";
import type { ProductRow } from "@/lib/products/schema";
import type { TemplateWithItems } from "@/lib/templates/schema";

type ItemChangeKind = "existing" | "added" | "updated" | "removed";

type TemplateItemState = {
  id: string | null;
  product_id: string;
  boxes: number;
  extra_units: number;
  kind: ItemChangeKind;
};

type TemplateEditorPayload = {
  account_id: string;
  toAdd: { product_id: string; box_count: number; unit_count: number }[];
  toUpdate: { id: string; box_count: number; unit_count: number }[];
  toRemove: string[];
};

type TemplateEditorProps = {
  account: Account;
  template: TemplateWithItems | null;
  products: ProductRow[];
  readOnly?: boolean;
  onSave: (payload: TemplateEditorPayload) => Promise<void>;
};

type ItemsAction =
  | { type: "add"; productId: string }
  | { type: "remove"; productId: string }
  | { type: "update"; productId: string; patch: { boxes?: number; extra_units?: number } };

function templateItemsToState(template: TemplateWithItems | null): TemplateItemState[] {
  return (template?.template_items ?? []).map((item) => ({
    id: item.id,
    product_id: item.product_id,
    boxes: item.box_count,
    extra_units: item.unit_count,
    kind: "existing" as const,
  }));
}

function toOrderRequestInput(item: TemplateItemState): OrderRequestItemInput {
  return { product_id: item.product_id, boxes: item.boxes, extra_units: item.extra_units };
}

function buildPayload(accountId: string, items: TemplateItemState[]): TemplateEditorPayload {
  return {
    account_id: accountId,
    toAdd: items
      .filter((i) => i.kind === "added")
      .map(({ product_id, boxes, extra_units }) => ({
        product_id,
        box_count: boxes,
        unit_count: extra_units,
      })),
    toUpdate: items
      .filter((i) => i.kind === "updated" && i.id !== null)
      .map(({ id, boxes, extra_units }) => ({
        id: id as string,
        box_count: boxes,
        unit_count: extra_units,
      })),
    toRemove: items.filter((i) => i.kind === "removed" && i.id !== null).map((i) => i.id as string),
  };
}

function itemsReducer(state: TemplateItemState[], action: ItemsAction): TemplateItemState[] {
  switch (action.type) {
    case "add":
      return [
        ...state,
        { id: null, product_id: action.productId, boxes: 1, extra_units: 0, kind: "added" },
      ];
    case "remove":
      return state.map((item) =>
        item.product_id === action.productId ? { ...item, kind: "removed" as const } : item,
      );
    case "update":
      return state.map((item) => {
        if (item.product_id !== action.productId) return item;
        const nextKind = item.kind === "existing" ? "updated" : item.kind;
        return { ...item, ...action.patch, kind: nextKind };
      });
  }
}

export function TemplateEditor({
  account,
  template,
  products,
  readOnly = false,
  onSave,
}: TemplateEditorProps) {
  const [items, dispatch] = useReducer(itemsReducer, template, templateItemsToState);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const visibleItems = items.filter((i) => i.kind !== "removed");

  function handleAddItem(productId: string) {
    if (visibleItems.some((i) => i.product_id === productId)) return;
    dispatch({ type: "add", productId });
  }

  function handleRemoveItem(productId: string) {
    dispatch({ type: "remove", productId });
  }

  function handleUpdateItem(productId: string, patch: { boxes?: number; extra_units?: number }) {
    dispatch({ type: "update", productId, patch });
  }

  async function handleSave() {
    setSubmitting(true);
    try {
      await onSave(buildPayload(account.id, items));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-8 flex flex-col gap-1">
        <Link
          to="/manage/accounts"
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Accounts
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Order template</h1>
        {readOnly && (
          <p className="text-sm text-muted-foreground">
            You are viewing this template in read-only mode.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {readOnly ? (
          <ReadOnlyItemsList items={visibleItems} products={products} />
        ) : (
          <DraftItemsList
            items={visibleItems.map(toOrderRequestInput)}
            products={products}
            onUpdate={handleUpdateItem}
            onRemove={handleRemoveItem}
          />
        )}

        {!readOnly && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              className="w-fit gap-2 text-primary hover:text-primary"
              onClick={() => setPickerOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add item
            </Button>
          </div>
        )}

        {!readOnly && (
          <>
            <Separator />
            <div className="flex sm:justify-end">
              <Button
                size="lg"
                className="w-full sm:w-auto sm:min-w-40 sm:px-8"
                disabled={submitting}
                onClick={handleSave}
              >
                {submitting ? "Saving…" : "Save template"}
              </Button>
            </div>
          </>
        )}
      </div>

      {!readOnly && (
        <CatalogPickerDrawer
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          products={products}
          templateProductIds={new Set<string>()}
          draftItems={visibleItems.map(toOrderRequestInput)}
          onAdd={handleAddItem}
          onRemove={handleRemoveItem}
        />
      )}
    </div>
  );
}

type ReadOnlyItemsListProps = {
  items: TemplateItemState[];
  products: ProductRow[];
};

function ReadOnlyItemsList({ items, products }: ReadOnlyItemsListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No items in this template.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => {
        const product = products.find((p) => p.id === item.product_id);
        return (
          <OrderItemCard
            key={item.product_id}
            readOnly
            name={product?.name ?? item.product_id}
            qtyPerBox={product?.qty_per_box ?? 1}
            boxes={item.boxes}
            units={item.extra_units}
          />
        );
      })}
    </div>
  );
}

export type { TemplateEditorPayload };
