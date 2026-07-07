import { resolvePlacedByName } from "@/lib/orderRequests/orderRequests.service";
import { formatOrderRef } from "@/lib/orderRequests/schema";
import { ok, type Result } from "@/lib/result";
import { rangeWindowDaysValue, recentActivityLimit, topProductsLimit } from "./constants";
import type { DashboardRepository } from "./dashboard.repository";
import type {
  DashboardData,
  DashboardOrder,
  DashboardOrderItem,
  DashboardRange,
  KpiDelta,
  KpiSummary,
  OrderTimePoint,
  RecentActivityItem,
  TopProduct,
} from "./schema";

export type DashboardServiceDeps = {
  repo: DashboardRepository;
  authorize: () => Promise<void>;
  now?: () => Date;
};

export function itemUnitVolume(item: DashboardOrderItem): number {
  return (item.boxes ?? 0) * (item.product?.qtyPerBox ?? 0) + (item.extraUnits ?? 0);
}

export function orderUnitVolume(order: DashboardOrder): number {
  return order.items.reduce((sum, item) => sum + itemUnitVolume(item), 0);
}

export function startOfWindow(now: Date, range: DashboardRange): Date {
  const days = rangeWindowDaysValue[range];
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function computeDelta(current: number, prior: number): KpiDelta {
  if (prior === 0) {
    return current > 0 ? { changePct: 100, direction: "up" } : { changePct: 0, direction: "flat" };
  }
  const changePct = Math.round(((current - prior) / prior) * 100);
  const direction = changePct > 0 ? "up" : changePct < 0 ? "down" : "flat";
  return { changePct: Math.abs(changePct), direction };
}

export function buildKpiSummary(
  orders: DashboardOrder[],
  activeAccounts: number,
  activeProducts: number,
  now: Date,
): KpiSummary {
  const priorStart = new Date(now);
  priorStart.setUTCDate(priorStart.getUTCDate() - 60);
  priorStart.setUTCHours(0, 0, 0, 0);

  const currentStart = new Date(now);
  currentStart.setUTCDate(currentStart.getUTCDate() - 30);
  currentStart.setUTCHours(0, 0, 0, 0);

  const currentOrders = orders.filter((o) => new Date(o.createdAt) >= currentStart);
  const priorOrders = orders.filter(
    (o) => new Date(o.createdAt) >= priorStart && new Date(o.createdAt) < currentStart,
  );

  const totalOrders = orders.length;
  const totalVolume = orders.reduce((sum, o) => sum + orderUnitVolume(o), 0);

  const currentOrderCount = currentOrders.length;
  const priorOrderCount = priorOrders.length;
  const currentVolume = currentOrders.reduce((sum, o) => sum + orderUnitVolume(o), 0);
  const priorVolume = priorOrders.reduce((sum, o) => sum + orderUnitVolume(o), 0);

  return {
    totalOrders,
    totalVolume,
    activeAccounts,
    activeProducts,
    totalOrdersDelta: computeDelta(currentOrderCount, priorOrderCount),
    totalVolumeDelta: computeDelta(currentVolume, priorVolume),
  };
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatAxisLabel(d: Date): string {
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function formatWeekLabel(d: Date): string {
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

export function buildOrderTimeSeries(
  orders: DashboardOrder[],
  range: DashboardRange,
  now: Date,
): OrderTimePoint[] {
  const since = startOfWindow(now, range);
  const windowOrders = orders.filter((o) => new Date(o.createdAt) >= since);

  const useWeekly = range === "3m";

  if (useWeekly) {
    const weekBuckets = new Map<string, { count: number; label: string }>();

    let cursor = new Date(since);
    cursor.setUTCDate(cursor.getUTCDate() - cursor.getUTCDay());
    cursor.setUTCHours(0, 0, 0, 0);

    const nowTime = now.getTime();
    while (cursor.getTime() <= nowTime) {
      const key = toDateKey(cursor);
      weekBuckets.set(key, { count: 0, label: formatWeekLabel(cursor) });
      cursor = new Date(cursor);
      cursor.setUTCDate(cursor.getUTCDate() + 7);
    }

    for (const order of windowOrders) {
      const d = new Date(order.createdAt);
      const weekStart = new Date(d);
      weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
      weekStart.setUTCHours(0, 0, 0, 0);
      const key = toDateKey(weekStart);
      const bucket = weekBuckets.get(key);
      if (bucket) bucket.count += 1;
    }

    return Array.from(weekBuckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { count, label }]) => ({ date, label, count }));
  }

  const days = rangeWindowDaysValue[range];
  const dailyBuckets = new Map<string, { count: number; label: string }>();

  for (let i = 0; i <= days; i++) {
    const d = new Date(since);
    d.setUTCDate(d.getUTCDate() + i);
    const key = toDateKey(d);
    dailyBuckets.set(key, { count: 0, label: formatAxisLabel(d) });
  }

  for (const order of windowOrders) {
    const key = toDateKey(new Date(order.createdAt));
    const bucket = dailyBuckets.get(key);
    if (bucket) bucket.count += 1;
  }

  return Array.from(dailyBuckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { count, label }]) => ({ date, label, count }));
}

export function buildTopProducts(orders: DashboardOrder[], limit = topProductsLimit): TopProduct[] {
  const volumeByProduct = new Map<string, { name: string; volume: number }>();

  for (const order of orders) {
    for (const item of order.items) {
      if (!item.product) continue;
      const existing = volumeByProduct.get(item.productId);
      const vol = itemUnitVolume(item);
      if (existing) {
        existing.volume += vol;
      } else {
        volumeByProduct.set(item.productId, { name: item.product.name, volume: vol });
      }
    }
  }

  return Array.from(volumeByProduct.entries())
    .map(([productId, { name, volume }]) => ({ productId, name, volume }))
    .sort((a, b) => b.volume - a.volume || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function buildRecentActivity(
  orders: DashboardOrder[],
  limit = recentActivityLimit,
): RecentActivityItem[] {
  return orders.slice(0, limit).map((order) => {
    const user = order.user
      ? {
          id: order.user.id,
          name: order.user.name,
          role: order.user.role as "admin" | "staff" | "user",
        }
      : null;
    const { placedByName } = resolvePlacedByName(user);
    return {
      id: order.id,
      orderRef: formatOrderRef(order.orderNumber),
      accountName: order.account?.name ?? "Unknown",
      placedByName,
      volume: orderUnitVolume(order),
      createdAt: order.createdAt,
    };
  });
}

export async function getDashboardData(deps: DashboardServiceDeps): Promise<Result<DashboardData>> {
  await deps.authorize();

  const now = (deps.now ?? (() => new Date()))();
  const sinceIso = startOfWindow(now, "3m").toISOString();

  const [ordersRes, accountsRes, productsRes] = await Promise.all([
    deps.repo.findOrdersWithItemsSince(sinceIso),
    deps.repo.countActiveAccounts(),
    deps.repo.countActiveProducts(),
  ]);

  if (!ordersRes.ok) return ordersRes;
  if (!accountsRes.ok) return accountsRes;
  if (!productsRes.ok) return productsRes;

  const orders = ordersRes.value;

  return ok({
    kpis: buildKpiSummary(orders, accountsRes.value, productsRes.value, now),
    timeSeries: {
      "7d": buildOrderTimeSeries(orders, "7d", now),
      "30d": buildOrderTimeSeries(orders, "30d", now),
      "3m": buildOrderTimeSeries(orders, "3m", now),
    },
    topProducts: buildTopProducts(orders),
    recentActivity: buildRecentActivity(orders),
  });
}
