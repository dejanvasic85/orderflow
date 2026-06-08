import type { z } from "zod";
import { fetchSessionOrThrow } from "@/lib/auth/auth.server";
import { notifyOrderPlaced } from "@/lib/notifications/notifications.server";
import { err, ok } from "@/lib/result";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { assertAdminOrStaff } from "@/lib/users/users.server";
import type { createOrderRequestSchema } from "./schema";
import { formatOrderRef } from "./schema";

const orderRequestWithItemsSelect =
  "id, order_number, account_id, placed_by, template_id, delivery_address, delivery_instructions, status, created_at, updated_at, order_request_items(id, product_id, boxes, extra_bottles, created_at, products(id, name, qty_per_box)), templates(id, name), users!order_requests_placed_by_fkey(id, name), accounts(id, name)" as const;

const orderHistorySelect =
  "id, order_number, placed_by, status, created_at, order_request_items(boxes, extra_bottles), users!order_requests_placed_by_fkey(id, name, role)" as const;

const allOrderHistorySelect =
  "id, order_number, placed_by, status, created_at, order_request_items(boxes, extra_bottles), users!order_requests_placed_by_fkey(id, name, role), accounts(id, name)" as const;

const maxOrderHistoryRows = 200;

export type OrderHistoryItem = {
  id: string;
  order_number: number;
  placed_by: string;
  placed_by_name: string;
  placed_by_org_name?: string;
  status: string;
  created_at: string;
  total_bottles: number;
  total_boxes: number;
  account_name?: string;
};

const bwowLabel = { placed_by_name: "bwow", placed_by_org_name: "Boutique Wines of the World" };
const unknownPlacedByValue = { placed_by_name: "Unknown" } as const;

type PlacedByUser = { id: string; name: string; role: string } | null;

type OrderHistoryRow = {
  id: string;
  order_number: number;
  placed_by: string;
  status: string;
  created_at: string;
  order_request_items: { boxes: number | null; extra_bottles: number | null }[];
  users: unknown;
  accounts?: unknown;
};

function resolvePlacedByName(user: PlacedByUser): {
  placed_by_name: string;
  placed_by_org_name?: string;
} {
  if (!user) return unknownPlacedByValue;
  if (user.role === "admin" || user.role === "staff") return bwowLabel;
  return { placed_by_name: user.name || "Unknown" };
}

function mapOrderHistoryRow(row: OrderHistoryRow): OrderHistoryItem {
  const rowItems = row.order_request_items ?? [];
  const user = row.users as PlacedByUser;
  const account = row.accounts as { id: string; name: string } | null | undefined;
  const { placed_by_name, placed_by_org_name } = resolvePlacedByName(user);
  return {
    id: row.id,
    order_number: row.order_number,
    placed_by: row.placed_by,
    placed_by_name,
    ...(placed_by_org_name ? { placed_by_org_name } : {}),
    status: row.status,
    created_at: row.created_at,
    total_boxes: rowItems.reduce((sum, i) => sum + (i.boxes ?? 0), 0),
    total_bottles: rowItems.reduce((sum, i) => sum + (i.extra_bottles ?? 0), 0),
    ...(account?.name ? { account_name: account.name } : {}),
  };
}

export async function fetchAllOrderHistory() {
  const supabase = createSupabaseServerClient();
  await assertAdminOrStaff(supabase);

  const { data, error } = await supabase
    .from("order_requests")
    .select(allOrderHistorySelect)
    .order("created_at", { ascending: false })
    .limit(maxOrderHistoryRows);

  if (error) return err({ message: error.message });
  return ok((data ?? []).map(mapOrderHistoryRow));
}

export async function fetchOrderHistoryForAccount(accountId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("order_requests")
    .select(orderHistorySelect)
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });

  if (error) return err({ message: error.message });
  return ok((data ?? []).map(mapOrderHistoryRow));
}

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

export async function fetchOrderRequestAsAdminOrStaff(id: string) {
  const supabase = createSupabaseServerClient();
  await assertAdminOrStaff(supabase);
  const { data, error } = await supabase
    .from("order_requests")
    .select(orderRequestWithItemsSelect)
    .eq("id", id)
    .single();
  if (error) return err({ message: error.message });
  return ok(data);
}

export async function insertOrderRequestOnBehalf(data: z.infer<typeof createOrderRequestSchema>) {
  const supabase = createSupabaseServerClient();
  await assertAdminOrStaff(supabase);
  return insertOrderRequest(data);
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

  fireOrderNotification({ supabase, order, data, placedById: user.id });

  return ok(order);
}

function fireOrderNotification({
  supabase,
  order,
  data,
  placedById,
}: {
  supabase: ReturnType<typeof createSupabaseServerClient>;
  order: { id: string; order_number: number };
  data: z.infer<typeof createOrderRequestSchema>;
  placedById: string;
}): void {
  const fetchPayload = async () => {
    const [accountResult, placedByResult, productsResult] = await Promise.all([
      supabase.from("accounts").select("name").eq("id", data.account_id).single(),
      supabase.from("users").select("name").eq("id", placedById).single(),
      supabase
        .from("products")
        .select("id, name")
        .in(
          "id",
          data.items.map((i) => i.product_id),
        ),
    ]);

    const accountName = accountResult.data?.name ?? data.account_id;
    const placedByName = placedByResult.data?.name ?? "Unknown";
    const productMap = new Map((productsResult.data ?? []).map((p) => [p.id, p.name]));

    const items = data.items.map((item) => ({
      productName: productMap.get(item.product_id) ?? item.product_id,
      boxes: item.boxes,
      extraBottles: item.extra_bottles,
    }));

    await notifyOrderPlaced({
      orderRef: formatOrderRef(order.order_number),
      accountId: data.account_id,
      accountName,
      placedByName,
      deliveryAddress: data.delivery_address ?? null,
      items,
    });
  };

  fetchPayload().catch((error) =>
    console.error("[notifications] order notification failed:", error),
  );
}
