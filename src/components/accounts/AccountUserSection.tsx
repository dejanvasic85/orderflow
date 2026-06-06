import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlusIcon, UserXIcon } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  assignUserToAccount,
  listAccountUsers,
  unassignUserFromAccount,
} from "@/lib/accounts/accounts.functions";
import { asResult } from "@/lib/result";
import { listUsers } from "@/lib/users/users.functions";
import { UserSearchCombobox } from "./UserSearchCombobox";

type AssignedUser = { id: string; name: string; email: string | null };

type Props = {
  accountId: string;
  readOnly?: boolean;
  onUserCountChange?: (count: number) => void;
};

function getInitials(name: string) {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export function AccountUserSection({ accountId, readOnly = false, onUserCountChange }: Props) {
  const queryClient = useQueryClient();

  const accountUsersQuery = useQuery({
    queryKey: ["accountUsers", accountId],
    queryFn: async () => {
      const result = asResult<
        { user_id: string; users: { id: string; name: string; email: string | null } | null }[]
      >(await listAccountUsers({ data: accountId }));
      if (!result.ok) throw new Error(result.error.message);
      return result.value;
    },
  });

  const allUsersQuery = useQuery({
    queryKey: ["users", "user"],
    enabled: !readOnly,
    queryFn: async () => {
      const result = asResult<{ id: string; name: string }[]>(
        await listUsers({ data: { role: "user" } }),
      );
      if (!result.ok) throw new Error(result.error.message);
      return result.value;
    },
  });

  async function refetchAndNotify() {
    await queryClient.refetchQueries({ queryKey: ["accountUsers", accountId] });
    const fresh = queryClient.getQueryData<{ user_id: string }[]>(["accountUsers", accountId]);
    onUserCountChange?.(fresh?.length ?? 0);
  }

  const assignMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = asResult(
        await assignUserToAccount({ data: { account_id: accountId, user_id: userId } }),
      );
      if (!result.ok) throw new Error(result.error.message);
    },
    onSuccess: refetchAndNotify,
    onError: (e) => toast.error(e.message),
  });

  const unassignMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = asResult(
        await unassignUserFromAccount({ data: { account_id: accountId, user_id: userId } }),
      );
      if (!result.ok) throw new Error(result.error.message);
    },
    onSuccess: refetchAndNotify,
    onError: (e) => toast.error(e.message),
  });

  if (accountUsersQuery.isPending || (!readOnly && allUsersQuery.isPending)) {
    return (
      <div className="rounded-lg border border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Separator />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    );
  }

  const assignedUserIds = new Set((accountUsersQuery.data ?? []).map((r) => r.user_id));

  const assignedUsers: AssignedUser[] = (accountUsersQuery.data ?? [])
    .filter((r) => r.users !== null)
    .map((r) => ({ id: r.user_id, name: r.users!.name, email: r.users!.email }));

  const unassignedUsers = (allUsersQuery.data ?? []).filter((u) => !assignedUserIds.has(u.id));

  const isMutating = assignMutation.isPending || unassignMutation.isPending;

  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Members</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {assignedUsers.length}
          </span>
        </div>
        {!readOnly && (
          <UserSearchCombobox
            users={unassignedUsers}
            disabled={isMutating}
            onSelect={(userId) => assignMutation.mutate(userId)}
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={isMutating || unassignedUsers.length === 0}
              >
                <UserPlusIcon className="size-3.5" />
                Add user
              </Button>
            }
          />
        )}
      </div>

      <Separator />

      {assignedUsers.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <UserPlusIcon className="size-4 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No users assigned to this account yet.</p>
        </div>
      ) : (
        <ul>
          {assignedUsers.map((user, index) => {
            const isRemoving = unassignMutation.isPending && unassignMutation.variables === user.id;
            return (
              <li key={user.id}>
                <div className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
                  <Avatar size="sm">
                    <AvatarFallback className="text-[0.65rem] font-medium">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium">{user.name}</span>
                    {user.email && (
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    )}
                  </div>
                  {!readOnly && (
                    <button
                      type="button"
                      aria-label={`Remove ${user.name}`}
                      disabled={isRemoving || isMutating}
                      onClick={() => unassignMutation.mutate(user.id)}
                      className="flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 disabled:pointer-events-none disabled:opacity-30"
                    >
                      <UserXIcon className="size-3.5" />
                    </button>
                  )}
                </div>
                {index < assignedUsers.length - 1 && <Separator />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
