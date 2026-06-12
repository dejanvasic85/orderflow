import type { z } from "zod";
import { fetchSessionOrThrow } from "@/lib/auth/auth.server";
import { notifyOrderPlaced } from "@/lib/notifications/notifications.server";
import { err, ok } from "@/lib/result";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { isStaffOrAdmin, type UserRole } from "@/lib/users/schema";
import { assertAdminOrStaff } from "@/lib/users/users.server";
import type { createOrderRequestSchema, ListOrdersSearch } from "./schema";
import { formatOrderRef, orderPageSize, type OrderHistoryItem } from "./schema";

const orderRequestWithItemsSelect =
  "id, order_number, account_id, placed_by, template_id, delivery_address, delivery_instructions, status, created_at, updated_at, order_request_items(id, product_id, boxes, extra_bottles, created_at, products(id, name, qty_per_box)), templates(id, name), users!order_requests_placed_by_fkey(id, name), accounts(id, name)" as const;

const orderHistorySelect =
  "id, order_number, placed_by, status, created_at, order_request_items(boxes, extra_bottles), users!order_requests_placed_by_fkey(id, name, role)" as const;

const allOrderHistorySelect =
  "id, order_number, placed_by, status, created_at, order_request_items(boxes, extra_bottles), users!order_requests_placed_by_fkey(id, name, role), accounts(id, name)" as const;

const bwowLabel = { placedByName: "bwow", placedByOrgName: "Boutique Wines of the World" };
const unknownPlacedByValue = { placedByName: "Unknown" } as const;

type PlacedByUser = { id: string; name: string; role: UserRole } | null;

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
  placedByName: string;
  placedByOrgName?: string;
} {
  if (!user) return unknownPlacedByValue;
  if (isStaffOrAdmin(user.role)) return bwowLabel;
  return { placedByName: user.name || "Unknown" };
}

function mapOrderHistoryRow(row: OrderHistoryRow): OrderHistoryItem {
  const rowItems = row.order_request_items ?? [];
  const user = row.users as PlacedByUser;
  const account = row.accounts as { id: string; name: string } | null | undefined;
  const { placedByName, placedByOrgName } = resolvePlacedByName(user);
  return {
    id: row.id,
    order_number: row.order_number,
    placed_by: row.placed_by,
    placedByName,
    ...(placedByOrgName ? { placedByOrgName } : {}),
    status: row.status,
    created_at: row.created_at,
    total_boxes: rowItems.reduce((sum, i) => sum + (i.boxes ?? 0), 0),
    total_bottles: rowItems.reduce((sum, i) => sum + (i.extra_bottles ?? 0), 0),
    ...(account?.name ? { account_name: account.name } : {}),
  };
}

export async function fetchAllOrderHistory(filters: ListOrdersSearch = {}) {
  const supabase = createSupabaseServerClient();
  await assertAdminOrStaff(supabase);

  let query = supabase
    .from("order_requests")
    .select(allOrderHistorySelect, { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters.q) {
    const num = parseInt(filters.q.replace(/\D/g, ""), 10);
    if (!isNaN(num)) {
      query = query.eq("order_number", num);
    } else {
      return ok({ orders: [], total: 0 });
    }
  }

  const page = filters.page ?? 1;
  const from = (page - 1) * orderPageSize;
  query = query.range(from, from + orderPageSize - 1);

  const { data, error, count } = await query;
  if (error) return err({ message: error.message });
  return ok({ orders: (data ?? []).map(mapOrderHistoryRow), total: count ?? 0 });
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

  await fireOrderNotification({ order, data, placedById: user.id });

  return ok(order);
}

type OrderNotificationOptions = {
  order: { id: string; order_number: number };
  data: z.infer<typeof createOrderRequestSchema>;
  placedById: string;
};

async function fireOrderNotification({
  order,
  data,
  placedById,
}: OrderNotificationOptions): Promise<void> {
  const admin = createSupabaseAdminClient();

  const [accountResult, placedByResult, productsResult] = await Promise.all([
    admin.from("accounts").select("name").eq("id", data.account_id).single(),
    admin.from("users").select("id, name, role").eq("id", placedById).single(),
    admin
      .from("products")
      .select("id, name")
      .in(
        "id",
        data.items.map((i) => i.product_id),
      ),
  ]);

  const accountName = accountResult.data?.name ?? data.account_id;
  const { placedByName } = resolvePlacedByName(placedByResult.data ?? null);
  const productMap = new Map((productsResult.data ?? []).map((p) => [p.id, p.name]));

  const items = data.items.map((item) => ({
    productName: productMap.get(item.product_id) ?? item.product_id,
    boxes: item.boxes,
    extraBottles: item.extra_bottles,
  }));

  await notifyOrderPlaced({
    orderId: order.id,
    orderRef: formatOrderRef(order.order_number),
    accountId: data.account_id,
    placedById,
    accountName,
    placedByName,
    deliveryAddress: data.delivery_address ?? null,
    items,
  });
}
