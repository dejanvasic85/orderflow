import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { UserEditPanel } from "@/components/users/UserEditPanel";
import { UserList, type RoleFilter } from "@/components/users/UserList";
import { useMediaQuery } from "@/hooks/use-media-query";
import { listAccounts } from "@/lib/accounts/accounts.functions";
import type { Account } from "@/lib/accounts/schema";
import { asResult } from "@/lib/result";
import type { UpdateUserAccountsInput, User } from "@/lib/users/schema";
import {
  checkEmailExists,
  inviteUser,
  listUsers,
  resendInvite,
  updateUser,
  updateUserAccounts,
} from "@/lib/users/users.functions";

export const Route = createFileRoute("/_protected/manage/users")({
  loader: async () => {
    const [usersRaw, accountsRaw] = await Promise.all([listUsers(), listAccounts()]);
    const usersResult = asResult<User[]>(usersRaw);
    const accountsResult = asResult<Account[]>(accountsRaw);
    if (!usersResult.ok) throw new Error(usersResult.error.message);
    if (!accountsResult.ok) throw new Error(accountsResult.error.message);
    return { users: usersResult.value, accounts: accountsResult.value };
  },
  component: UsersPage,
});

function UsersPage() {
  const { users: loadedUsers, accounts } = Route.useLoaderData();
  const [users, setUsers] = useState<User[]>(loadedUsers);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  useEffect(() => {
    setUsers(loadedUsers);
  }, [loadedUsers]);

  const selectedUser = users.find((u) => u.id === selectedId) ?? null;
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const panelSide = isDesktop ? "right" : "bottom";
  const panelClassName = "overflow-y-auto p-0 sm:w-[50vw] sm:min-w-[800px]";

  function handleSelectUser(user: User) {
    setSelectedId(user.id);
  }

  function handleStartCreate() {
    setSelectedId(null);
    setCreating(true);
  }

  async function handleSave(updated: User, accountsPayload?: UpdateUserAccountsInput) {
    const result = asResult<void>(
      await updateUser({
        data: {
          id: updated.id,
          name: updated.name,
          phone: updated.phone,
          role: updated.role,
          active: updated.active,
          notification_preferences: updated.notification_preferences,
        },
      }),
    );
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }

    if (
      accountsPayload &&
      (accountsPayload.toAdd.length > 0 || accountsPayload.toRemove.length > 0)
    ) {
      const accountsResult = asResult<void>(await updateUserAccounts({ data: accountsPayload }));
      if (!accountsResult.ok) {
        toast.error(accountsResult.error.message);
        return;
      }
      const kept = updated.accounts.filter((a) => !accountsPayload.toRemove.includes(a.id));
      const added = accountsPayload.toAdd
        .map((id) => accounts.find((a) => a.id === id))
        .filter((a): a is Account => a !== undefined)
        .map((a) => ({ id: a.id, name: a.name }));
      updated = { ...updated, accounts: [...kept, ...added] };
    }

    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setSelectedId(null);
  }

  async function handleInvite(draft: User) {
    const result = asResult<User>(
      await inviteUser({
        data: {
          email: draft.email,
          name: draft.name,
          phone: draft.phone,
          role: draft.role,
          notification_preferences: draft.notification_preferences,
          accountIds: [],
        },
      }),
    );
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    setUsers((prev) => [result.value, ...prev]);
    setCreating(false);
    toast.success(`Invite sent to ${result.value.email}`);
  }

  async function handleResendInvite(userId: string) {
    const result = asResult<{ invitedAt: string }>(await resendInvite({ data: userId }));
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, invited_at: result.value.invitedAt } : u)),
    );
  }

  function handleDiscard() {
    setSelectedId(null);
    setCreating(false);
  }

  return (
    <>
      <PageHeader title="Users" actions={<Button onClick={handleStartCreate}>+ New user</Button>} />
      <PageContent>
        <UserList
          users={users}
          selectedId={selectedId}
          roleFilter={roleFilter}
          onSelectUser={handleSelectUser}
          onRoleFilterChange={setRoleFilter}
        />

        <Sheet open={!!selectedUser} onOpenChange={(open) => !open && handleDiscard()}>
          <SheetContent
            side={panelSide}
            className={panelClassName}
            onInteractOutside={(e) => e.preventDefault()}
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Edit user</SheetTitle>
              <SheetDescription>Edit user details and settings</SheetDescription>
            </SheetHeader>
            {selectedUser && (
              <UserEditPanel
                key={selectedUser.id}
                user={selectedUser}
                onSave={handleSave}
                onDiscard={handleDiscard}
                onResendInvite={() => handleResendInvite(selectedUser.id)}
                allAccounts={accounts}
              />
            )}
          </SheetContent>
        </Sheet>

        <Sheet open={creating} onOpenChange={(open) => !open && handleDiscard()}>
          <SheetContent side={panelSide} className={panelClassName}>
            <SheetHeader className="sr-only">
              <SheetTitle>Invite user</SheetTitle>
              <SheetDescription>Send an invite email to a new user</SheetDescription>
            </SheetHeader>
            {creating && (
              <UserEditPanel
                mode="create"
                onSave={handleInvite}
                onDiscard={handleDiscard}
                onCheckEmailExists={async (email) => {
                  const result = asResult<boolean>(await checkEmailExists({ data: email }));
                  if (!result.ok) throw new Error(result.error.message);
                  return result.value;
                }}
              />
            )}
          </SheetContent>
        </Sheet>
      </PageContent>
    </>
  );
}
