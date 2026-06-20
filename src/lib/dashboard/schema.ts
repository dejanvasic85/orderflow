import type { dashboardRanges } from "./constants";

export type DashboardRange = (typeof dashboardRanges)[number];

export type KpiDelta = { changePct: number; direction: "up" | "down" | "flat" };

export type KpiSummary = {
  totalOrders: number;
  totalVolume: number;
  activeAccounts: number;
  activeProducts: number;
  totalOrdersDelta?: KpiDelta;
  totalVolumeDelta?: KpiDelta;
};

export type OrderTimePoint = {
  date: string;
  label: string;
  count: number;
};

export type TopProduct = {
  productId: string;
  name: string;
  volume: number;
};

export type RecentActivityItem = {
  id: string;
  orderRef: string;
  accountName: string;
  placedByName: string;
  volume: number;
  createdAt: string;
};

export type DashboardData = {
  kpis: KpiSummary;
  timeSeries: Record<DashboardRange, OrderTimePoint[]>;
  topProducts: TopProduct[];
  recentActivity: RecentActivityItem[];
};
