import { z } from "zod";
import type { Database } from "@/lib/database.types";
import type { ProductRow } from "@/lib/products/schema";
import type { TemplateRow } from "@/lib/templates/schema";
import type { UserRole } from "@/lib/users/schema";

export type OrderRequestRow = Database["public"]["Tables"]["order_requests"]["Row"];
export type OrderRequestItemRow = Database["public"]["Tables"]["order_request_items"]["Row"];

export type OrderRequestWithItems = OrderRequestRow & {
  order_request_items: Array<
    OrderRequestItemRow & {
      products: Pick<ProductRow, "id" | "name" | "qty_per_box" | "image_url">;
    }
  >;
  templates: Pick<TemplateRow, "id" | "name"> | null;
  users: { id: string; name: string } | null;
  accounts: { id: string; name: string } | null;
};

export const orderRequestItemInputSchema = z.object({
  product_id: z.uuid(),
  boxes: z.number().int().min(0),
  extra_units: z.number().int().min(0),
});

export const createOrderRequestSchema = z.object({
  account_id: z.uuid(),
  template_id: z.uuid().nullable().optional(),
  delivery_address: z.string().nullable().optional(),
  delivery_instructions: z.string().nullable().optional(),
  items: z.array(orderRequestItemInputSchema).min(1),
});

export type CreateOrderRequestInput = z.infer<typeof createOrderRequestSchema>;
export type OrderRequestItemInput = z.infer<typeof orderRequestItemInputSchema>;

export type OrderHistoryItem = {
  id: string;
  order_number: number;
  placed_by: string;
  placedByName: string;
  placedByOrgName?: string;
  created_at: string;
  total_units: number;
  total_boxes: number;
  account_name?: string;
};

export type PlacedByUser = { id: string; name: string; role: UserRole } | null;

export type OrderHistoryRow = {
  id: string;
  order_number: number;
  placed_by: string;
  created_at: string;
  order_request_items: { boxes: number | null; extra_units: number | null }[];
  users: unknown;
  accounts?: unknown;
};

export const listOrdersSearchSchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
});

export type ListOrdersSearch = z.infer<typeof listOrdersSearchSchema>;

export type PagedOrdersResult = {
  orders: OrderHistoryItem[];
  total: number;
};

export const orderPageSize = 20;

export function formatOrderRef(orderNumber: number): string {
  return `ORD-${String(orderNumber).padStart(4, "0")}`;
}
