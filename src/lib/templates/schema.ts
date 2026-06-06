import { z } from "zod";
import type { Database } from "@/lib/database.types";
import type { ProductRow } from "@/lib/products/schema";

export type TemplateRow = Database["public"]["Tables"]["templates"]["Row"];
export type TemplateItemRow = Database["public"]["Tables"]["template_items"]["Row"];

export type TemplateItem = TemplateItemRow & {
  products: Pick<ProductRow, "id" | "name" | "qty_per_box">;
};

export type TemplateWithItems = TemplateRow & {
  template_items: Array<TemplateItem>;
};

export const createTemplateSchema = z.object({
  account_id: z.uuid(),
  name: z.string().min(1),
});

export const updateTemplateSchema = createTemplateSchema.partial().extend({ id: z.uuid() });

export const addTemplateItemSchema = z.object({
  template_id: z.uuid(),
  product_id: z.uuid(),
  box_count: z.number().int().min(0).optional(),
  bottle_count: z.number().int().min(0).optional(),
});

export const removeTemplateItemSchema = z.object({ id: z.uuid() });

export const replaceTemplateItemsSchema = z.object({
  account_id: z.uuid(),
  items: z.array(
    z.object({
      product_id: z.uuid(),
      box_count: z.number().int().min(0),
      bottle_count: z.number().int().min(0),
    }),
  ),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type AddTemplateItemInput = z.infer<typeof addTemplateItemSchema>;
export type ReplaceTemplateItemsInput = z.infer<typeof replaceTemplateItemsSchema>;
