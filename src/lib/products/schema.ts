import { z } from "zod";
import type { Database } from "@/lib/database.types";

// Raw DB row shape — for other repositories to type their own embedded
// product selects. Domain/UI code should use `Product` (camelCase) instead.
export type ProductRow = Database["public"]["Tables"]["products"]["Row"];

export type Product = {
  id: string;
  name: string;
  imageUrl: string | null;
  qtyPerBox: number;
  active: boolean;
  externalId: string | null;
  createdAt: string;
  updatedAt: string;
};

export const createProductSchema = z.object({
  name: z.string().min(1),
  imageUrl: z.string().url().nullable().optional(),
  qtyPerBox: z.number().int().min(1),
  active: z.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({ id: z.uuid() });

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const productPageSize = 12;

export const listProductsSearchSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
});

export const listProductsFiltersSchema = listProductsSearchSchema.extend({
  includeInactive: z.boolean().optional(),
});

export type ListProductsSearch = z.infer<typeof listProductsSearchSchema>;
export type ListProductsFilters = z.infer<typeof listProductsFiltersSchema>;
export type PagedProductsResult = { products: Product[]; total: number };
