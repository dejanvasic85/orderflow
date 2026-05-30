import { AlertCircle, ArrowLeft, Minus, Package, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { loadDraft, saveDraft } from "@/lib/orderRequests/draftOrder";
import type { OrderRequestItemInput } from "@/lib/orderRequests/schema";
import type { ProductRow } from "@/lib/products/schema";
import type { TemplateItem, TemplateWithItems } from "@/lib/templates/schema";
import { CatalogPickerDrawer } from "./CatalogPickerDrawer";

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

type TemplateItemCardProps = {
  item: TemplateItem;
};

type DraftItemsListProps = {
  items: OrderRequestItemInput[];
  products: ProductRow[];
  onUpdate: (productId: string, patch: { boxes?: number; extra_bottles?: number }) => void;
  onRemove: (productId: string) => void;
};

function TemplateItemCard({ item }: TemplateItemCardProps) {
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

function TemplateItemsList({ template }: { template: TemplateWithItems }) {
  if (template.template_items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {template.template_items.map((item) => (
        <TemplateItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function DraftItemCard({
  item,
  product,
  onUpdate,
  onRemove,
}: {
  item: OrderRequestItemInput;
  product: ProductRow | undefined;
  onUpdate: (patch: { boxes?: number; extra_bottles?: number }) => void;
  onRemove: () => void;
}) {
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

function DraftItemsList({ items, products, onUpdate, onRemove }: DraftItemsListProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => {
        const product = products.find((p) => p.id === item.product_id);
        return (
          <DraftItemCard
            key={item.product_id}
            item={item}
            product={product}
            onUpdate={(patch) => onUpdate(item.product_id, patch)}
            onRemove={() => onRemove(item.product_id)}
          />
        );
      })}
    </div>
  );
}

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

        <DraftItemsList
          items={draftItems}
          products={products}
          onUpdate={handleUpdateDraftItem}
          onRemove={handleRemoveDraftItem}
        />

        <Button
          variant="outline"
          className="w-fit gap-2 text-primary hover:text-primary"
          onClick={() => setPickerOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add item
        </Button>

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
