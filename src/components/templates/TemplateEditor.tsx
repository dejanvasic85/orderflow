import { Link } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, Plus } from "lucide-react";
import { useState } from "react";
import { CatalogPickerDrawer } from "@/components/orderRequests/CatalogPickerDrawer";
import { DraftItemsList } from "@/components/orderRequests/DraftItemsList";
import { OrderItemCard } from "@/components/orderRequests/OrderItemCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Account } from "@/lib/accounts/schema";
import type { OrderRequestItemInput } from "@/lib/orderRequests/schema";
import type { ProductRow } from "@/lib/products/schema";
import type { TemplateWithItems } from "@/lib/templates/schema";

type TemplateEditorPayload = {
  account_id: string;
  items: { product_id: string; box_count: number; bottle_count: number }[];
};

type TemplateEditorProps = {
  account: Account;
  template: TemplateWithItems | null;
  products: ProductRow[];
  readOnly?: boolean;
  onSave: (payload: TemplateEditorPayload) => Promise<void>;
};

function templateItemsToInputs(template: TemplateWithItems | null): OrderRequestItemInput[] {
  return (template?.template_items ?? []).map((item) => ({
    product_id: item.product_id,
    boxes: item.box_count,
    extra_bottles: item.bottle_count,
  }));
}

function inputsToPayloadItems(
  inputs: OrderRequestItemInput[],
): { product_id: string; box_count: number; bottle_count: number }[] {
  return inputs.map((item) => ({
    product_id: item.product_id,
    box_count: item.boxes,
    bottle_count: item.extra_bottles,
  }));
}

export function TemplateEditor({
  account,
  template,
  products,
  readOnly = false,
  onSave,
}: TemplateEditorProps) {
  const [items, setItems] = useState<OrderRequestItemInput[]>(() =>
    templateItemsToInputs(template),
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAddItem(productId: string) {
    if (items.some((i) => i.product_id === productId)) return;
    setItems((prev) => [...prev, { product_id: productId, boxes: 1, extra_bottles: 0 }]);
  }

  function handleRemoveItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  }

  function handleUpdateItem(productId: string, patch: { boxes?: number; extra_bottles?: number }) {
    setItems((prev) => prev.map((i) => (i.product_id === productId ? { ...i, ...patch } : i)));
  }

  async function handleSave() {
    setSubmitting(true);
    setError(null);
    try {
      await onSave({
        account_id: account.id,
        items: inputsToPayloadItems(items),
      });
    } catch {
      setError("Something went wrong saving the template. Please try again.");
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
          <ReadOnlyItemsList items={items} products={products} />
        ) : (
          <DraftItemsList
            items={items}
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

        {error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Save failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
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
          draftItems={items}
          onAdd={handleAddItem}
          onRemove={handleRemoveItem}
        />
      )}
    </div>
  );
}

type ReadOnlyItemsListProps = {
  items: OrderRequestItemInput[];
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
            bottles={item.extra_bottles}
          />
        );
      })}
    </div>
  );
}

export type { TemplateEditorPayload };
