import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type UserStatus = "active" | "inactive";

type Props = {
  status: UserStatus;
};

const labelMap: Record<UserStatus, string> = {
  active: "Active",
  inactive: "Inactive",
};

export function UserStatusBadge({ status }: Props) {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === "active" &&
          "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        status === "inactive" && "border-muted-foreground/30 bg-muted text-muted-foreground",
      )}
    >
      {labelMap[status]}
    </Badge>
  );
}
