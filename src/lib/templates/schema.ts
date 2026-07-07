import { z } from "zod";

export type TemplateItem = {
  id: string;
  templateId: string;
  productId: string;
  boxCount: number;
  unitCount: number;
  createdBy: string | null;
  createdAt: string;
  product: { id: string; name: string; qtyPerBox: number };
};

export type TemplateWithItems = {
  id: string;
  accountId: string;
  name: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  templateItems: TemplateItem[];
};

export const createTemplateSchema = z.object({
  accountId: z.uuid(),
  name: z.string().min(1),
});

export const updateTemplateSchema = createTemplateSchema.partial().extend({ id: z.uuid() });

export const addTemplateItemSchema = z.object({
  templateId: z.uuid(),
  productId: z.uuid(),
  boxCount: z.number().int().min(0).optional(),
  unitCount: z.number().int().min(0).optional(),
});

export const removeTemplateItemSchema = z.object({ id: z.uuid() });

export const saveTemplateItemsSchema = z.object({
  accountId: z.uuid(),
  toAdd: z.array(
    z.object({
      productId: z.uuid(),
      boxCount: z.number().int().min(0),
      unitCount: z.number().int().min(0),
    }),
  ),
  toUpdate: z.array(
    z.object({
      id: z.uuid(),
      boxCount: z.number().int().min(0),
      unitCount: z.number().int().min(0),
    }),
  ),
  toRemove: z.array(z.uuid()),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type AddTemplateItemInput = z.infer<typeof addTemplateItemSchema>;
export type SaveTemplateItemsInput = z.infer<typeof saveTemplateItemsSchema>;
