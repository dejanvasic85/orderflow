import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { dashboardRanges } from "@/lib/dashboard/constants";
import type { DashboardRange, OrderTimePoint } from "@/lib/dashboard/schema";

type OrdersOverTimeChartProps = {
  series: OrderTimePoint[];
  range: DashboardRange;
  onRangeChange: (range: DashboardRange) => void;
};

const chartConfig = {
  count: {
    label: "Orders",
    color: "var(--foreground)",
  },
} satisfies ChartConfig;

const rangeLabels: Record<DashboardRange, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "3m": "Last 3 months",
};

export function OrdersOverTimeChart({ series, range, onRangeChange }: OrdersOverTimeChartProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-card p-6 ring-1 ring-foreground/10">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">Orders over time</p>
          <p className="text-sm text-muted-foreground">{rangeLabels[range]}</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          {dashboardRanges.map((r) => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                r === range
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <ChartContainer config={chartConfig} className="h-64 w-full">
        <AreaChart data={series} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="orderGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--foreground)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="var(--foreground)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="var(--foreground)"
            strokeWidth={1.5}
            fill="url(#orderGradient)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: "var(--foreground)" }}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
