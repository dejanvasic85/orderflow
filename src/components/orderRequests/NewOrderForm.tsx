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
import { DraftItemsList } from "./DraftItemsList";
import { TemplateItemsList } from "./TemplateItemsList";

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
  onBack: () => void;
  onSubmit: (data: OrderFormPayload) => Promise<void>;
};

export function NewOrderForm({
  accountId,
  accountName,
  defaultDeliveryInstructions,
  template,
  products,
  onBack,
  onSubmit,
}: NewOrderFormProps) {
  const [draftItems, setDraftItems] = useState<OrderRequestItemInput[]>(() => loadDraft(accountId));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deliveryInstructions, setDeliveryInstructions] = useState(
    defaultDeliveryInstructions ?? "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const templateProductIds = new Set(template?.template_items.map((i) => i.product_id) ?? []);
  const hasItems = (template?.template_items.length ?? 0) > 0 || draftItems.length > 0;

  function updateDraft(items: OrderRequestItemInput[]) {
    setDraftItems(items);
    saveDraft(accountId, items);
  }

  function handleAddDraftItem(productId: string) {
    if (draftItems.some((i) => i.product_id === productId)) return;
    updateDraft([...draftItems, { product_id: productId, boxes: 1, extra_bottles: 0 }]);
  }

  function handleRemoveDraftItem(productId: string) {
    updateDraft(draftItems.filter((i) => i.product_id !== productId));
  }

  function handleUpdateDraftItem(
    productId: string,
    patch: { boxes?: number; extra_bottles?: number },
  ) {
    updateDraft(draftItems.map((i) => (i.product_id === productId ? { ...i, ...patch } : i)));
  }

  async function handleSubmit() {
    const templateItems =
      template?.template_items.map((item) => ({
        product_id: item.product_id,
        boxes: item.box_count,
        extra_bottles: item.bottle_count,
      })) ?? [];

    const items = [...templateItems, ...draftItems];
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
        {template ? <TemplateItemsList template={template} /> : null}

        <Separator />

        <DraftItemsList
          items={draftItems}
          products={products}
          onUpdate={handleUpdateDraftItem}
          onRemove={handleRemoveDraftItem}
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

        {hasItems && <Separator />}

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
            disabled={!hasItems || submitting}
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
        templateProductIds={templateProductIds}
        draftItems={draftItems}
        onAdd={handleAddDraftItem}
        onRemove={handleRemoveDraftItem}
      />
    </div>
  );
}

export type { OrderFormPayload };
