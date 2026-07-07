import { err, ok, type Result } from "@/lib/result";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { DashboardOrder } from "./schema";

type DashboardOrderRow = {
  id: string;
  order_number: number;
  created_at: string;
  account_id: string;
  placed_by: string;
  order_request_items: {
    product_id: string;
    boxes: number | null;
    extra_units: number | null;
    products: { id: string; name: string; qty_per_box: number } | null;
  }[];
  accounts: { id: string; name: string } | null;
  users: { id: string; name: string; role: string } | null;
};

const ordersWithItemsSelect =
  "id, order_number, created_at, account_id, placed_by, order_request_items(product_id, boxes, extra_units, products(id, name, qty_per_box)), accounts(id, name), users!order_requests_placed_by_fkey(id, name, role)" as const;

function toDashboardOrder(row: DashboardOrderRow): DashboardOrder {
  return {
    id: row.id,
    orderNumber: row.order_number,
    createdAt: row.created_at,
    accountId: row.account_id,
    placedBy: row.placed_by,
    items: row.order_request_items.map((item) => ({
      productId: item.product_id,
      boxes: item.boxes,
      extraUnits: item.extra_units,
      product: item.products
        ? { id: item.products.id, name: item.products.name, qtyPerBox: item.products.qty_per_box }
        : null,
    })),
    account: row.accounts,
    user: row.users,
  };
}

export type DashboardRepository = {
  // TODO(scale): at high order/item volumes, replace with .rpc("dashboard_stats", { since })
  // calling a Postgres function that returns pre-aggregated data. The service layer stays unchanged.
  findOrdersWithItemsSince(sinceIso: string): Promise<Result<DashboardOrder[]>>;
  countActiveAccounts(): Promise<Result<number>>;
  countActiveProducts(): Promise<Result<number>>;
};

export function createDashboardRepository(): DashboardRepository {
  return {
    async findOrdersWithItemsSince(sinceIso) {
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase
        .from("order_requests")
        .select(ordersWithItemsSelect)
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false });
      if (error) return err({ message: error.message });
      const rows = (data ?? []) as DashboardOrderRow[];
      return ok(rows.map(toDashboardOrder));
    },

    async countActiveAccounts() {
      const supabase = createSupabaseServerClient();
      const { count, error } = await supabase
        .from("accounts")
        .select("*", { count: "exact", head: true });
      if (error) return err({ message: error.message });
      return ok(count ?? 0);
    },

    async countActiveProducts() {
      const supabase = createSupabaseServerClient();
      const { count, error } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("active", true);
      if (error) return err({ message: error.message });
      return ok(count ?? 0);
    },
  };
}
