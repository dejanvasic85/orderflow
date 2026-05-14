import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MockAccount } from "./mockData";

type AccountCardProps = {
  account: MockAccount;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function AccountCard({ account }: AccountCardProps) {
  return (
    <Link
      to="/accounts/$accountId/orders"
      params={{ accountId: account.id }}
      className={cn(
        "flex items-center justify-between rounded-2xl border bg-card px-5 py-4",
        "transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-base font-semibold">{account.name}</span>
        <span className="text-sm text-muted-foreground">
          {account.lastOrderAt ? `Last order ${formatDate(account.lastOrderAt)}` : "No orders yet"}
        </span>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
