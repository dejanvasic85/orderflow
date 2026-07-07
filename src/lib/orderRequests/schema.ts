import { z } from "zod";
import type { UserRole } from "@/lib/users/schema";

export type OrderRequestItem = {
  id: string;
  productId: string;
  boxes: number;
  extraUnits: number;
  createdAt: string;
  product: { id: string; name: string; qtyPerBox: number; imageUrl: string | null };
};

export type OrderRequestWithItems = {
  id: string;
  orderNumber: number;
  accountId: string;
  placedBy: string;
  templateId: string | null;
  deliveryAddress: string | null;
  deliveryInstructions: string | null;
  createdAt: string;
  updatedAt: string;
  orderRequestItems: OrderRequestItem[];
  template: { id: string; name: string } | null;
  user: { id: string; name: string } | null;
  account: { id: string; name: string } | null;
};

export const orderRequestItemInputSchema = z.object({
  productId: z.uuid(),
  boxes: z.number().int().min(0),
  extraUnits: z.number().int().min(0),
});

export const createOrderRequestSchema = z.object({
  accountId: z.uuid(),
  templateId: z.uuid().nullable().optional(),
  deliveryAddress: z.string().nullable().optional(),
  deliveryInstructions: z.string().nullable().optional(),
  items: z.array(orderRequestItemInputSchema).min(1),
});

export type CreateOrderRequestInput = z.infer<typeof createOrderRequestSchema>;
export type OrderRequestItemInput = z.infer<typeof orderRequestItemInputSchema>;

export type OrderHistoryItem = {
  id: string;
  orderNumber: number;
  placedBy: string;
  placedByName: string;
  placedByOrgName?: string;
  createdAt: string;
  totalUnits: number;
  totalBoxes: number;
  accountName?: string;
  accountId?: string;
};

export type PlacedByUser = { id: string; name: string; role: UserRole } | null;

export type OrderHistoryRow = {
  id: string;
  orderNumber: number;
  placedBy: string;
  createdAt: string;
  items: { boxes: number | null; extraUnits: number | null }[];
  user: PlacedByUser;
  account?: { id: string; name: string } | null;
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
