import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { KpiSummary } from "@/lib/dashboard/schema";

type KpiCardsProps = {
  kpis: KpiSummary;
};

type DeltaProps = {
  changePct: number;
  direction: "up" | "down" | "flat";
};

function Delta({ changePct, direction }: DeltaProps) {
  if (direction === "flat") return null;
  const isUp = direction === "up";
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${isUp ? "text-foreground" : "text-muted-foreground"}`}
    >
      {isUp ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {isUp ? "+" : "-"}
      {changePct}%
    </span>
  );
}

type KpiCardProps = {
  label: string;
  value: string;
  sub?: string;
  delta?: { changePct: number; direction: "up" | "down" | "flat" };
};

function KpiCard({ label, value, sub, delta }: KpiCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
          {delta && <Delta {...delta} />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export function KpiCards({ kpis }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiCard
        label="Total orders"
        value={kpis.totalOrders.toLocaleString()}
        sub="Last 3 months"
        delta={kpis.totalOrdersDelta}
      />
      <KpiCard
        label="Total volume"
        value={kpis.totalVolume.toLocaleString()}
        sub="Units ordered"
        delta={kpis.totalVolumeDelta}
      />
      <KpiCard
        label="Active accounts"
        value={kpis.activeAccounts.toLocaleString()}
        sub="Customer businesses"
      />
      <KpiCard
        label="Active products"
        value={kpis.activeProducts.toLocaleString()}
        sub="In catalog"
      />
    </div>
  );
}
