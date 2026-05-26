import { Link } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, Package, Plus } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { CreateOrderRequestInput } from "@/lib/orderRequests/schema";
import type { TemplateItem, TemplateWithItems } from "@/lib/templates/schema";

type NewOrderFormProps = {
  accountId: string;
  accountName: string;
  template: TemplateWithItems | null;
  onSubmit: (data: CreateOrderRequestInput) => Promise<void>;
};

type OrderItemCardProps = {
  item: TemplateItem;
};

function OrderItemCard({ item }: OrderItemCardProps) {
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
        <OrderItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}

export function NewOrderForm({ accountId, accountName, template, onSubmit }: NewOrderFormProps) {
  const hasItems = template && template.template_items.length > 0;
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const items =
      template?.template_items.map((item) => ({
        product_id: item.product_id,
        boxes: item.box_count,
        extra_bottles: item.bottle_count,
      })) ?? [];

    if (items.length === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        account_id: accountId,
        template_id: template?.id ?? null,
        note: note || null,
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
        <Link
          to="/accounts/$accountId"
          params={{ accountId }}
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {accountName}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">New order</h1>
      </div>

      <div className="flex flex-col gap-6">
        {template ? <TemplateItemsList template={template} /> : null}

        <Button variant="outline" className="w-fit gap-2 text-primary hover:text-primary">
          <Plus className="h-4 w-4" />
          Add item
        </Button>

        {hasItems && <Separator />}

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Note (optional)
          </label>
          <Textarea
            placeholder="Any special instructions..."
            rows={3}
            className="resize-none"
            value={note}
            onChange={(e) => setNote(e.target.value)}
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
    </div>
  );
}
