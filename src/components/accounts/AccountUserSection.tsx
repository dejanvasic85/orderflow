import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { XIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  assignUserToAccount,
  listAccountUsers,
  unassignUserFromAccount,
} from "@/lib/accounts/accounts.functions";
import { asResult } from "@/lib/result";
import { listUsers } from "@/lib/users/users.functions";
import { UserSearchCombobox } from "./UserSearchCombobox";

type AssignedUser = { id: string; name: string };

type Props = {
  accountId: string;
  onUserCountChange?: (delta: 1 | -1) => void;
};

export function AccountUserSection({ accountId, onUserCountChange }: Props) {
  const queryClient = useQueryClient();

  const accountUsersQuery = useQuery({
    queryKey: ["accountUsers", accountId],
    queryFn: async () => {
      const result = asResult<{ user_id: string; users: { id: string; name: string } | null }[]>(
        await listAccountUsers({ data: accountId }),
      );
      if (!result.ok) throw new Error(result.error.message);
      return result.value;
    },
  });

  const allUsersQuery = useQuery({
    queryKey: ["users", "user"],
    queryFn: async () => {
      const result = asResult<{ id: string; name: string }[]>(
        await listUsers({ data: { role: "user" } }),
      );
      if (!result.ok) throw new Error(result.error.message);
      return result.value;
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = asResult(
        await assignUserToAccount({ data: { account_id: accountId, user_id: userId } }),
      );
      if (!result.ok) throw new Error(result.error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["accountUsers", accountId] });
      onUserCountChange?.(1);
    },
    onError: (e) => toast.error(e.message),
  });

  const unassignMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = asResult(
        await unassignUserFromAccount({ data: { account_id: accountId, user_id: userId } }),
      );
      if (!result.ok) throw new Error(result.error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["accountUsers", accountId] });
      onUserCountChange?.(-1);
    },
    onError: (e) => toast.error(e.message),
  });

  if (accountUsersQuery.isPending || allUsersQuery.isPending) {
    return (
      <div className="flex flex-col gap-3">
        <Label>Assigned users</Label>
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  const assignedUserIds = new Set((accountUsersQuery.data ?? []).map((r) => r.user_id));

  const assignedUsers: AssignedUser[] = (accountUsersQuery.data ?? [])
    .filter((r) => r.users !== null)
    .map((r) => ({ id: r.user_id, name: r.users!.name }));

  const unassignedUsers = (allUsersQuery.data ?? []).filter((u) => !assignedUserIds.has(u.id));

  const isMutating = assignMutation.isPending || unassignMutation.isPending;

  return (
    <div className="flex flex-col gap-3">
      <Label>Assigned users</Label>

      {assignedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {assignedUsers.map((user) => (
            <Badge key={user.id} variant="secondary" className="gap-1.5 py-1 pl-2.5 pr-1.5">
              {user.name}
              <button
                type="button"
                aria-label={`Remove ${user.name}`}
                disabled={unassignMutation.variables === user.id || isMutating}
                onClick={() => unassignMutation.mutate(user.id)}
                className="flex items-center justify-center rounded-full transition-colors hover:text-foreground disabled:opacity-40"
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <UserSearchCombobox
        users={unassignedUsers}
        disabled={isMutating}
        onSelect={(userId) => assignMutation.mutate(userId)}
      />
    </div>
  );
}
