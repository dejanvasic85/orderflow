import type { TemplateWithItems } from "@/lib/templates/schema";
import { TemplateItemCard } from "./TemplateItemCard";

type TemplateItemsListProps = {
  template: TemplateWithItems;
};

export function TemplateItemsList({ template }: TemplateItemsListProps) {
  if (template.template_items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xl font-semibold tracking-tight">Template Items</h2>
      <p className="text-base text-pretty">
        To make changes to the ordering template, contact your admin.
      </p>
      {template.template_items.map((item) => (
        <TemplateItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
