import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type UserStatus = "active" | "inactive" | "pending";

type Props = {
  status: UserStatus;
};

const labelMap: Record<UserStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  pending: "Pending",
};

export function UserStatusBadge({ status }: Props) {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === "active" &&
          "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        status === "inactive" && "border-muted-foreground/30 bg-muted text-muted-foreground",
        status === "pending" &&
          "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
      )}
    >
      {labelMap[status]}
    </Badge>
  );
}
