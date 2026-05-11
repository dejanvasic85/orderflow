import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type UserStatus = "active" | "invite_pending";

type Props = {
  status: UserStatus;
};

const labelMap: Record<UserStatus, string> = {
  active: "Active",
  invite_pending: "Invite pending",
};

export function UserStatusBadge({ status }: Props) {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === "active" &&
          "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        status === "invite_pending" &&
          "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
      )}
    >
      {labelMap[status]}
    </Badge>
  );
}
