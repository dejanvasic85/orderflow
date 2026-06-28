import { AlertCircle, ArrowLeft, Plus } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { loadDraft, saveDraft } from "@/lib/orderRequests/draftOrder";
import type { OrderRequestItemInput } from "@/lib/orderRequests/schema";
import type { ProductRow } from "@/lib/products/schema";
import type { TemplateWithItems } from "@/lib/templates/schema";
import { CatalogPickerDrawer } from "./CatalogPickerDrawer";
import { OrderItemsList } from "./OrderItemsList";

type OrderFormPayload = {
  templateId: string | null;
  deliveryInstructions: string | null;
  items: OrderRequestItemInput[];
};

type NewOrderFormProps = {
  accountId: string;
  accountName: string;
  defaultDeliveryInstructions: string | null;
  template: TemplateWithItems | null;
  products: ProductRow[];
  persistDraft?: boolean;
  onBack: () => void;
  onSubmit: (data: OrderFormPayload) => Promise<void>;
};

function buildInitialItems(
  template: TemplateWithItems | null,
  persistDraft: boolean,
  accountId: string,
): OrderRequestItemInput[] {
  if (persistDraft) {
    const draft = loadDraft(accountId);
    if (draft !== null) return draft;
  }
  return (template?.template_items ?? []).map((i) => ({
    product_id: i.product_id,
    boxes: i.box_count,
    extra_units: i.unit_count,
  }));
}

export function NewOrderForm({
  accountId,
  accountName,
  defaultDeliveryInstructions,
  template,
  products,
  persistDraft = true,
  onBack,
  onSubmit,
}: NewOrderFormProps) {
  const [items, setItems] = useState<OrderRequestItemInput[]>(() =>
    buildInitialItems(template, persistDraft, accountId),
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deliveryInstructions, setDeliveryInstructions] = useState(
    defaultDeliveryInstructions ?? "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemProductIds = new Set(items.map((i) => i.product_id));

  function updateItems(next: OrderRequestItemInput[]) {
    setItems(next);
    if (persistDraft) saveDraft(accountId, next);
  }

  function handleAddItem(productId: string) {
    if (items.some((i) => i.product_id === productId)) return;
    updateItems([...items, { product_id: productId, boxes: 1, extra_units: 0 }]);
  }

  function handleRemoveItem(productId: string) {
    updateItems(items.filter((i) => i.product_id !== productId));
  }

  function handleUpdateItem(productId: string, patch: { boxes?: number; extra_units?: number }) {
    updateItems(items.map((i) => (i.product_id === productId ? { ...i, ...patch } : i)));
  }

  async function handleSubmit() {
    if (items.length === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        templateId: template?.id ?? null,
        deliveryInstructions: deliveryInstructions || null,
        items,
      });
    } catch {
      setError("Something went wrong submitting your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-8 flex flex-col gap-1">
        <button
          type="button"
          onClick={onBack}
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {accountName}
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">New order</h1>
      </div>

      <div className="flex flex-col gap-6">
        <OrderItemsList
          items={items}
          products={products}
          onUpdate={handleUpdateItem}
          onRemove={handleRemoveItem}
        />

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

        {items.length > 0 && <Separator />}

        <div className="flex flex-col gap-2">
          <label
            htmlFor="deliveryInstructions"
            className="text-xs font-medium uppercase tracking-widest text-muted-foreground"
          >
            Delivery instructions (optional)
          </label>
          <Textarea
            id="deliveryInstructions"
            placeholder="Any special instructions..."
            rows={3}
            className="resize-none"
            value={deliveryInstructions}
            onChange={(e) => setDeliveryInstructions(e.target.value)}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Order failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex sm:justify-end">
          <Button
            size="lg"
            className="w-full sm:w-auto sm:min-w-40 sm:px-8"
            disabled={items.length === 0 || submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Submitting…" : "Submit order"}
          </Button>
        </div>
      </div>

      <CatalogPickerDrawer
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        products={products}
        itemProductIds={itemProductIds}
        onAdd={handleAddItem}
        onRemove={handleRemoveItem}
      />
    </div>
  );
}

export type { OrderFormPayload };
