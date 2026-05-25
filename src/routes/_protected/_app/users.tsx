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
import { listAccounts } from "@/lib/accounts/queries";
import { asResult } from "@/lib/result";
import {
  checkEmailExists,
  inviteUser,
  listUsers,
  resendInvite,
  updateUser,
} from "@/lib/users/queries";
import type { User, UserAccount } from "@/lib/users/schema";

export const Route = createFileRoute("/_protected/_app/users")({
  loader: async () => {
    const [users, accounts] = await Promise.all([listUsers(), listAccounts()]);
    const availableAccounts: UserAccount[] = accounts.map((a) => ({
      id: a.id,
      name: a.name,
    }));
    return { users, availableAccounts };
  },
  component: UsersPage,
});

function UsersPage() {
  const { users: loadedUsers, availableAccounts } = Route.useLoaderData();
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
  const panelClassName = "overflow-y-auto p-0 sm:w-[600px] sm:max-w-[600px]";

  function handleSelectUser(user: User) {
    setSelectedId(user.id);
  }

  function handleStartCreate() {
    setSelectedId(null);
    setCreating(true);
  }

  async function handleSave(updated: User) {
    const result = asResult<User>(
      await updateUser({
        data: {
          id: updated.id,
          name: updated.name,
          phone: updated.phone,
          role: updated.role,
          active: updated.active,
          notification_preferences: updated.notification_preferences,
          accountIds: updated.accounts.map((a) => a.id),
        },
      }),
    );
    if (!result.ok) {
      toast.error(result.error.message);
      return;
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
          accountIds: draft.accounts.map((a) => a.id),
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
          <SheetContent side={panelSide} className={panelClassName}>
            <SheetHeader className="sr-only">
              <SheetTitle>Edit user</SheetTitle>
              <SheetDescription>Edit user details and settings</SheetDescription>
            </SheetHeader>
            {selectedUser && (
              <UserEditPanel
                key={selectedUser.id}
                user={selectedUser}
                availableAccounts={availableAccounts}
                onSave={handleSave}
                onDiscard={handleDiscard}
                onResendInvite={() => handleResendInvite(selectedUser.id)}
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
                availableAccounts={availableAccounts}
                onSave={handleInvite}
                onDiscard={handleDiscard}
                onCheckEmailExists={(email) => checkEmailExists({ data: email })}
              />
            )}
          </SheetContent>
        </Sheet>
      </PageContent>
    </>
  );
}
