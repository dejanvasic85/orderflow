import type { TemplateWithItems } from "@/lib/templates/schema";
import { OrderItemCard } from "./OrderItemCard";

type TemplateItemsListProps = {
  template: TemplateWithItems;
};

export function TemplateItemsList({ template }: TemplateItemsListProps) {
  if (template.template_items.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold tracking-tight">Template Items</h2>
      <p className="text-base text-pretty">
        To make changes to the ordering template, contact your admin.
      </p>
      {template.template_items.map((item) => (
        <OrderItemCard
          key={item.id}
          readOnly
          name={item.products.name}
          qtyPerBox={item.products.qty_per_box}
          boxes={item.box_count}
          units={item.unit_count}
        />
      ))}
    </div>
  );
}
