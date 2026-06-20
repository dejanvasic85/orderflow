import { useState } from "react";
import type { DashboardData, DashboardRange } from "@/lib/dashboard/schema";
import { KpiCards } from "./KpiCards";
import { OrdersOverTimeChart } from "./OrdersOverTimeChart";
import { RecentActivityList } from "./RecentActivityList";
import { TopProductsList } from "./TopProductsList";

type DashboardViewProps = {
  data: DashboardData;
};

export function DashboardView({ data }: DashboardViewProps) {
  const [range, setRange] = useState<DashboardRange>("30d");

  return (
    <div className="flex flex-col gap-6">
      <KpiCards kpis={data.kpis} />
      <OrdersOverTimeChart series={data.timeSeries[range]} range={range} onRangeChange={setRange} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopProductsList products={data.topProducts} />
        <RecentActivityList items={data.recentActivity} />
      </div>
    </div>
  );
}
