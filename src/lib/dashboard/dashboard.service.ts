import { resolvePlacedByName } from "@/lib/orderRequests/orderRequests.service";
import { formatOrderRef } from "@/lib/orderRequests/schema";
import { ok, type Result } from "@/lib/result";
import { rangeWindowDaysValue, recentActivityLimit, topProductsLimit } from "./constants";
import type { DashboardRepository, DashboardOrderRow } from "./dashboard.repository";
import type {
  DashboardData,
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

export function itemBottleVolume(item: DashboardOrderRow["order_request_items"][number]): number {
  return (item.boxes ?? 0) * (item.products?.qty_per_box ?? 0) + (item.extra_bottles ?? 0);
}

export function orderBottleVolume(row: DashboardOrderRow): number {
  return row.order_request_items.reduce((sum, item) => sum + itemBottleVolume(item), 0);
}

export function startOfWindow(now: Date, range: DashboardRange): Date {
  const days = rangeWindowDaysValue[range];
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
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
  rows: DashboardOrderRow[],
  activeAccounts: number,
  activeProducts: number,
  now: Date,
): KpiSummary {
  const priorStart = new Date(now);
  priorStart.setDate(priorStart.getDate() - 60);
  priorStart.setHours(0, 0, 0, 0);

  const currentStart = new Date(now);
  currentStart.setDate(currentStart.getDate() - 30);
  currentStart.setHours(0, 0, 0, 0);

  const currentRows = rows.filter((r) => new Date(r.created_at) >= currentStart);
  const priorRows = rows.filter(
    (r) => new Date(r.created_at) >= priorStart && new Date(r.created_at) < currentStart,
  );

  const totalOrders = rows.length;
  const totalVolume = rows.reduce((sum, r) => sum + orderBottleVolume(r), 0);

  const currentOrderCount = currentRows.length;
  const priorOrderCount = priorRows.length;
  const currentVolume = currentRows.reduce((sum, r) => sum + orderBottleVolume(r), 0);
  const priorVolume = priorRows.reduce((sum, r) => sum + orderBottleVolume(r), 0);

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
  rows: DashboardOrderRow[],
  range: DashboardRange,
  now: Date,
): OrderTimePoint[] {
  const since = startOfWindow(now, range);
  const windowRows = rows.filter((r) => new Date(r.created_at) >= since);

  const useWeekly = range === "3m";

  if (useWeekly) {
    const weekBuckets = new Map<string, { count: number; label: string }>();

    let cursor = new Date(since);
    cursor.setDate(cursor.getDate() - cursor.getDay());
    cursor.setHours(0, 0, 0, 0);

    const nowTime = now.getTime();
    while (cursor.getTime() <= nowTime) {
      const key = toDateKey(cursor);
      weekBuckets.set(key, { count: 0, label: formatWeekLabel(cursor) });
      cursor = new Date(cursor);
      cursor.setDate(cursor.getDate() + 7);
    }

    for (const row of windowRows) {
      const d = new Date(row.created_at);
      const weekStart = new Date(d);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
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

  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = toDateKey(d);
    dailyBuckets.set(key, { count: 0, label: formatAxisLabel(d) });
  }

  for (const row of windowRows) {
    const key = toDateKey(new Date(row.created_at));
    const bucket = dailyBuckets.get(key);
    if (bucket) bucket.count += 1;
  }

  return Array.from(dailyBuckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { count, label }]) => ({ date, label, count }));
}

export function buildTopProducts(
  rows: DashboardOrderRow[],
  limit = topProductsLimit,
): TopProduct[] {
  const volumeByProduct = new Map<string, { name: string; volume: number }>();

  for (const row of rows) {
    for (const item of row.order_request_items) {
      if (!item.products) continue;
      const existing = volumeByProduct.get(item.product_id);
      const vol = itemBottleVolume(item);
      if (existing) {
        existing.volume += vol;
      } else {
        volumeByProduct.set(item.product_id, { name: item.products.name, volume: vol });
      }
    }
  }

  return Array.from(volumeByProduct.entries())
    .map(([productId, { name, volume }]) => ({ productId, name, volume }))
    .sort((a, b) => b.volume - a.volume || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function buildRecentActivity(
  rows: DashboardOrderRow[],
  limit = recentActivityLimit,
): RecentActivityItem[] {
  return rows.slice(0, limit).map((row) => {
    const user = row.users
      ? {
          id: row.users.id,
          name: row.users.name,
          role: row.users.role as "admin" | "staff" | "user",
        }
      : null;
    const { placedByName } = resolvePlacedByName(user);
    return {
      id: row.id,
      orderRef: formatOrderRef(row.order_number),
      accountName: row.accounts?.name ?? "Unknown",
      placedByName,
      volume: orderBottleVolume(row),
      createdAt: row.created_at,
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

  const rows = ordersRes.value;

  return ok({
    kpis: buildKpiSummary(rows, accountsRes.value, productsRes.value, now),
    timeSeries: {
      "7d": buildOrderTimeSeries(rows, "7d", now),
      "30d": buildOrderTimeSeries(rows, "30d", now),
      "3m": buildOrderTimeSeries(rows, "3m", now),
    },
    topProducts: buildTopProducts(rows),
    recentActivity: buildRecentActivity(rows),
  });
}
