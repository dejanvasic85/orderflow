import type { Logger } from "@/lib/log/logger";
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
  const rowItems = row.items ?? [];
  const { placedByName, placedByOrgName } = resolvePlacedByName(row.user);
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    placedBy: row.placedBy,
    placedByName,
    ...(placedByOrgName ? { placedByOrgName } : {}),
    createdAt: row.createdAt,
    totalBoxes: rowItems.reduce((sum, i) => sum + (i.boxes ?? 0), 0),
    totalUnits: rowItems.reduce((sum, i) => sum + (i.extraUnits ?? 0), 0),
    ...(row.account?.name ? { accountName: row.account.name } : {}),
    ...(row.account?.id ? { accountId: row.account.id } : {}),
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
  log: Logger;
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
  if (!result.ok) {
    deps.log.warn("order.placed", "order creation failed", { userId: user.id });
    return result;
  }

  deps.log.info("order.placed", "order created", {
    orderId: result.value.id,
    userId: user.id,
    accountId: input.accountId,
  });
  await fireOrderNotification(deps, result.value, input, user.id);
  return result;
}

export async function placeOrderOnBehalf(
  deps: OrderRequestServiceDeps,
  input: CreateOrderRequestInput,
): Promise<Result<CreatedOrder>> {
  await deps.authorize();
  const user = await deps.session();
  deps.log.info("order.placed", "staff placing order on behalf of account", {
    actorId: user.id,
    accountId: input.accountId,
  });
  return placeOrder(deps, input);
}

async function fireOrderNotification(
  deps: OrderRequestServiceDeps,
  order: CreatedOrder,
  input: CreateOrderRequestInput,
  placedById: string,
): Promise<void> {
  const [account, placedBy, products] = await Promise.all([
    deps.repo.findAccountName(input.accountId),
    deps.repo.findPlacedByUser(placedById),
    deps.repo.findProductsByIds(input.items.map((i) => i.productId)),
  ]);

  const accountName = account?.name ?? input.accountId;
  const placedByUser: PlacedByUser = placedBy
    ? { id: placedBy.id, name: placedBy.name, role: placedBy.role as UserRole }
    : null;
  const { placedByName } = resolvePlacedByName(placedByUser);
  const productMap = new Map(products.map((p) => [p.id, p.name]));

  const items = input.items.map((item) => ({
    productName: productMap.get(item.productId) ?? item.productId,
    boxes: item.boxes,
    extraUnits: item.extraUnits,
  }));

  await deps.notify({
    orderId: order.id,
    orderRef: formatOrderRef(order.order_number),
    accountId: input.accountId,
    placedById,
    accountName,
    placedByName,
    deliveryAddress: input.deliveryAddress ?? null,
    items,
  });
}
