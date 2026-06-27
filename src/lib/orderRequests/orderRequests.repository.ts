import { log } from "@/lib/log/logger";
import { err, ok, type Result } from "@/lib/result";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { CreateOrderRequestInput, OrderHistoryRow, OrderRequestWithItems } from "./schema";
import { orderPageSize } from "./schema";

const orderRequestWithItemsSelect =
  "id, order_number, account_id, placed_by, template_id, delivery_address, delivery_instructions, created_at, updated_at, order_request_items(id, product_id, boxes, extra_bottles, created_at, products(id, name, qty_per_box)), templates(id, name), users!order_requests_placed_by_fkey(id, name), accounts(id, name)" as const;

const orderHistorySelect =
  "id, order_number, placed_by, created_at, order_request_items(boxes, extra_bottles), users!order_requests_placed_by_fkey(id, name, role)" as const;

const allOrderHistorySelect =
  "id, order_number, placed_by, created_at, order_request_items(boxes, extra_bottles), users!order_requests_placed_by_fkey(id, name, role), accounts(id, name)" as const;

export type CreatedOrder = { id: string; order_number: number };

export type AllOrderHistoryFilter = { orderNumber?: number; page: number };

export type AccountInfo = { name: string } | null;
export type PlacedByInfo = { id: string; name: string; role: string } | null;
export type ProductInfo = { id: string; name: string };

/**
 * The only seam that talks to Supabase for order requests. Each method builds a
 * query, executes it, and returns a `Result` of raw rows — no business rules.
 * Services depend on this interface, never on the Supabase client directly.
 */
export type OrderRequestRepository = {
  findOrderRequestsForAccount(accountId: string): Promise<Result<OrderRequestWithItems[]>>;
  findOrderRequestById(id: string): Promise<Result<OrderRequestWithItems>>;
  findOrderHistoryForAccount(accountId: string): Promise<Result<OrderHistoryRow[]>>;
  findAllOrderHistory(
    filter: AllOrderHistoryFilter,
  ): Promise<Result<{ rows: OrderHistoryRow[]; total: number }>>;
  createOrderWithItems(
    input: CreateOrderRequestInput,
    placedById: string,
  ): Promise<Result<CreatedOrder>>;
  // Notification lookups (admin client) — used by the place-order flow.
  findAccountName(accountId: string): Promise<AccountInfo>;
  findPlacedByUser(userId: string): Promise<PlacedByInfo>;
  findProductsByIds(productIds: string[]): Promise<ProductInfo[]>;
};

export function createOrderRequestRepository(): OrderRequestRepository {
  return {
    async findOrderRequestsForAccount(accountId) {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from("order_requests")
        .select(orderRequestWithItemsSelect)
        .eq("account_id", accountId)
        .order("created_at", { ascending: false });
      if (error) {
        log.error("order.db", "fetch orders failed", { error: error.message });
        return err({ message: error.message });
      }
      // The PostgREST-inferred embedded-relation type is structurally close but not
      // assignable to OrderRequestWithItems (subtle nullability on nested relations).
      return ok((data ?? []) as OrderRequestWithItems[]);
    },

    async findOrderRequestById(id) {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from("order_requests")
        .select(orderRequestWithItemsSelect)
        .eq("id", id)
        .single();
      if (error) {
        log.error("order.db", "fetch order failed", { error: error.message });
        return err({ message: error.message });
      }
      return ok(data as OrderRequestWithItems);
    },

    async findOrderHistoryForAccount(accountId) {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from("order_requests")
        .select(orderHistorySelect)
        .eq("account_id", accountId)
        .order("created_at", { ascending: false });
      if (error) {
        log.error("order.db", "fetch history failed", { error: error.message });
        return err({ message: error.message });
      }
      return ok(data ?? []);
    },

    async findAllOrderHistory(filter) {
      const supabase = createSupabaseServerClient();
      let query = supabase
        .from("order_requests")
        .select(allOrderHistorySelect, { count: "exact" })
        .order("created_at", { ascending: false });

      if (filter.orderNumber !== undefined) {
        query = query.eq("order_number", filter.orderNumber);
      }

      const from = (filter.page - 1) * orderPageSize;
      query = query.range(from, from + orderPageSize - 1);

      const { data, error, count } = await query;
      if (error) {
        log.error("order.db", "fetch all history failed", { error: error.message });
        return err({ message: error.message });
      }
      return ok({ rows: data ?? [], total: count ?? 0 });
    },

    async createOrderWithItems(input, placedById) {
      // TODO(atomicity): the order row and its items are inserted as two separate
      // PostgREST calls, so a failed items insert leaves an orphaned order row.
      // supabase-js cannot run a multi-statement transaction; making this atomic
      // requires moving both inserts into a Postgres function called via .rpc().
      // Keeping the two-step behaviour for now — this method is the single seam to
      // change when we add the RPC.
      const supabase = createSupabaseServerClient();
      const { items, ...orderData } = input;

      const { data: order, error: orderError } = await supabase
        .from("order_requests")
        .insert({ ...orderData, placed_by: placedById })
        .select("id, order_number")
        .single();
      if (orderError) {
        log.error("order.db", "create order failed", { error: orderError.message });
        return err({ message: orderError.message });
      }

      const itemRows = items.map((item) => ({ ...item, order_request_id: order.id }));
      const { error: itemsError } = await supabase.from("order_request_items").insert(itemRows);
      if (itemsError) {
        log.error("order.db", "insert items failed", { error: itemsError.message });
        return err({ message: itemsError.message });
      }

      return ok(order);
    },

    async findAccountName(accountId) {
      const admin = createSupabaseAdminClient();
      const { data } = await admin.from("accounts").select("name").eq("id", accountId).single();
      return data ?? null;
    },

    async findPlacedByUser(userId) {
      const admin = createSupabaseAdminClient();
      const { data } = await admin.from("users").select("id, name, role").eq("id", userId).single();
      return data ?? null;
    },

    async findProductsByIds(productIds) {
      const admin = createSupabaseAdminClient();
      const { data } = await admin.from("products").select("id, name").in("id", productIds);
      return data ?? [];
    },
  };
}
