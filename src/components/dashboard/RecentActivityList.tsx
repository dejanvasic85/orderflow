import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import type { RecentActivityItem } from "@/lib/dashboard/schema";
import { formatRelativeTime } from "@/lib/dates";

type RecentActivityListProps = {
  items: RecentActivityItem[];
};

export function RecentActivityList({ items }: RecentActivityListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-3 rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <p className="font-medium">Recent activity</p>
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No orders yet</EmptyTitle>
            <EmptyDescription>Recent orders will appear here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-card p-6 ring-1 ring-foreground/10">
      <div>
        <p className="font-medium">Recent activity</p>
        <p className="text-sm text-muted-foreground">Latest orders</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="pb-2 text-left font-medium text-muted-foreground">Order</th>
              <th className="pb-2 text-left font-medium text-muted-foreground">Account</th>
              <th className="hidden pb-2 text-left font-medium text-muted-foreground md:table-cell">
                Placed by
              </th>
              <th className="pb-2 text-right font-medium text-muted-foreground">Units</th>
              <th className="pb-2 text-right font-medium text-muted-foreground">When</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item) => (
              <tr key={item.id} className="group">
                <td className="py-3 font-mono text-xs">{item.orderRef}</td>
                <td className="py-3">
                  <span className="truncate">{item.accountName}</span>
                </td>
                <td className="hidden py-3 text-muted-foreground md:table-cell">
                  {item.placedByName}
                </td>
                <td className="py-3 text-right tabular-nums">{item.volume.toLocaleString()}</td>
                <td className="py-3 text-right text-xs text-muted-foreground">
                  {formatRelativeTime(item.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
