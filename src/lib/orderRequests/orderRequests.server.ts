import type { z } from "zod";
import { fetchSessionOrThrow } from "@/lib/auth/auth.server";
import { err, ok } from "@/lib/result";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { createOrderRequestSchema } from "./schema";

const orderRequestWithItemsSelect =
  "id, order_number, account_id, placed_by, template_id, note, delivery_address, delivery_note, status, created_at, updated_at, order_request_items(id, product_id, boxes, extra_bottles, created_at, products(id, name, qty_per_box)), templates(id, name)" as const;

export async function fetchOrderRequestsForAccount(accountId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("order_requests")
    .select(orderRequestWithItemsSelect)
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });
  if (error) return err({ message: error.message });
  return ok(data ?? []);
}

export async function fetchOrderRequest(id: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("order_requests")
    .select(orderRequestWithItemsSelect)
    .eq("id", id)
    .single();
  if (error) return err({ message: error.message });
  return ok(data);
}

export async function insertOrderRequest(data: z.infer<typeof createOrderRequestSchema>) {
  const supabase = createSupabaseServerClient();
  const user = await fetchSessionOrThrow();
  const { items, ...orderData } = data;

  const { data: order, error: orderError } = await supabase
    .from("order_requests")
    .insert({ ...orderData, placed_by: user.id })
    .select("id, order_number")
    .single();

  if (orderError) return err({ message: orderError.message });

  const itemRows = items.map((item) => ({ ...item, order_request_id: order.id }));
  const { error: itemsError } = await supabase.from("order_request_items").insert(itemRows);

  if (itemsError) return err({ message: itemsError.message });

  return ok(order);
}
