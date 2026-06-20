import type { NotifyOrderPlacedInput } from "@/lib/notifications/notifications.server";
import { ok, type Result } from "@/lib/result";
import { isStaffOrAdmin, type UserRole } from "@/lib/users/schema";
import type { CreatedOrder, OrderRequestRepository } from "./orderRequests.repository";
import {
  formatOrderRef,
  type CreateOrderRequestInput,
  type ListOrdersSearch,
  type OrderHistoryItem,
  type OrderHistoryRow,
  type OrderRequestWithItems,
  type PlacedByUser,
} from "./schema";

const bwowLabel = { placedByName: "bwow", placedByOrgName: "Boutique Wines of the World" };
const unknownPlacedByValue = { placedByName: "Unknown" } as const;

export function resolvePlacedByName(user: PlacedByUser): {
  placedByName: string;
  placedByOrgName?: string;
} {
  if (!user) return unknownPlacedByValue;
  if (isStaffOrAdmin(user.role)) return bwowLabel;
  return { placedByName: user.name || "Unknown" };
}

export function mapOrderHistoryRow(row: OrderHistoryRow): OrderHistoryItem {
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
    created_at: row.created_at,
    total_boxes: rowItems.reduce((sum, i) => sum + (i.boxes ?? 0), 0),
    total_bottles: rowItems.reduce((sum, i) => sum + (i.extra_bottles ?? 0), 0),
    ...(account?.name ? { account_name: account.name } : {}),
  };
}

type OrderHistorySearch = { kind: "all"; orderNumber?: number; page: number } | { kind: "empty" };

/**
 * Resolves a free-text order search into a concrete query plan. A non-numeric
 * query cannot match any order number, so it short-circuits to an empty result.
 */
export function parseOrderHistorySearch(filters: ListOrdersSearch): OrderHistorySearch {
  const page = filters.page ?? 1;
  if (filters.q) {
    const num = parseInt(filters.q.replace(/\D/g, ""), 10);
    if (isNaN(num)) return { kind: "empty" };
    return { kind: "all", orderNumber: num, page };
  }
  return { kind: "all", page };
}

type SessionUser = { id: string };

export type OrderRequestServiceDeps = {
  repo: OrderRequestRepository;
  session: () => Promise<SessionUser>;
  authorize: () => Promise<void>;
  notify: (input: NotifyOrderPlacedInput) => Promise<void>;
};

export async function listOrderRequestsForAccount(
  deps: OrderRequestServiceDeps,
  accountId: string,
): Promise<Result<OrderRequestWithItems[]>> {
  return deps.repo.findOrderRequestsForAccount(accountId);
}

export async function getOrderRequest(
  deps: OrderRequestServiceDeps,
  id: string,
): Promise<Result<OrderRequestWithItems>> {
  return deps.repo.findOrderRequestById(id);
}

export async function getOrderRequestAsAdminOrStaff(
  deps: OrderRequestServiceDeps,
  id: string,
): Promise<Result<OrderRequestWithItems>> {
  await deps.authorize();
  return deps.repo.findOrderRequestById(id);
}

export async function listOrderHistoryForAccount(
  deps: OrderRequestServiceDeps,
  accountId: string,
): Promise<Result<OrderHistoryItem[]>> {
  const result = await deps.repo.findOrderHistoryForAccount(accountId);
  if (!result.ok) return result;
  return ok(result.value.map(mapOrderHistoryRow));
}

export async function listAllOrderHistory(
  deps: OrderRequestServiceDeps,
  filters: ListOrdersSearch,
): Promise<Result<{ orders: OrderHistoryItem[]; total: number }>> {
  await deps.authorize();

  const search = parseOrderHistorySearch(filters);
  if (search.kind === "empty") return ok({ orders: [], total: 0 });

  const result = await deps.repo.findAllOrderHistory({
    orderNumber: search.orderNumber,
    page: search.page,
  });
  if (!result.ok) return result;
  return ok({ orders: result.value.rows.map(mapOrderHistoryRow), total: result.value.total });
}

export async function placeOrder(
  deps: OrderRequestServiceDeps,
  input: CreateOrderRequestInput,
): Promise<Result<CreatedOrder>> {
  const user = await deps.session();

  const result = await deps.repo.createOrderWithItems(input, user.id);
  if (!result.ok) return result;

  await fireOrderNotification(deps, result.value, input, user.id);
  return result;
}

export async function placeOrderOnBehalf(
  deps: OrderRequestServiceDeps,
  input: CreateOrderRequestInput,
): Promise<Result<CreatedOrder>> {
  await deps.authorize();
  return placeOrder(deps, input);
}

async function fireOrderNotification(
  deps: OrderRequestServiceDeps,
  order: CreatedOrder,
  input: CreateOrderRequestInput,
  placedById: string,
): Promise<void> {
  const [account, placedBy, products] = await Promise.all([
    deps.repo.findAccountName(input.account_id),
    deps.repo.findPlacedByUser(placedById),
    deps.repo.findProductsByIds(input.items.map((i) => i.product_id)),
  ]);

  const accountName = account?.name ?? input.account_id;
  const placedByUser: PlacedByUser = placedBy
    ? { id: placedBy.id, name: placedBy.name, role: placedBy.role as UserRole }
    : null;
  const { placedByName } = resolvePlacedByName(placedByUser);
  const productMap = new Map(products.map((p) => [p.id, p.name]));

  const items = input.items.map((item) => ({
    productName: productMap.get(item.product_id) ?? item.product_id,
    boxes: item.boxes,
    extraBottles: item.extra_bottles,
  }));

  await deps.notify({
    orderId: order.id,
    orderRef: formatOrderRef(order.order_number),
    accountId: input.account_id,
    placedById,
    accountName,
    placedByName,
    deliveryAddress: input.delivery_address ?? null,
    items,
  });
}
