import { z } from "zod";
import type { Database } from "@/lib/database.types";

export type ProductRow = Database["public"]["Tables"]["products"]["Row"];

export const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  qty_per_box: z.number().int().min(1),
  active: z.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({ id: z.uuid() });

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
