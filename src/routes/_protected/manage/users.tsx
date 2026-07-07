import { useNavigate, useRouterState } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { WhenAllowed } from "@/components/auth/WhenAllowed";
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
import { SetUserPasswordPanel } from "@/components/users/SetUserPasswordPanel";
import { UserEditPanel } from "@/components/users/UserEditPanel";
import { UserList, type RoleFilter } from "@/components/users/UserList";
import { useDelayedBoolean } from "@/hooks/use-delayed-boolean";
import { useMediaQuery } from "@/hooks/use-media-query";
import { listAccounts } from "@/lib/accounts/accounts.functions";
import type { Account, PagedAccountsResult } from "@/lib/accounts/schema";
import { can, permissions } from "@/lib/permissions";
import { asResult, type Result } from "@/lib/result";
import type { PagedUsersResult, UpdateUserAccountsInput, User } from "@/lib/users/schema";
import { listUsersSearchSchema, userPageSize } from "@/lib/users/schema";
import {
  checkEmailExists,
  inviteUser,
  listUsers,
  resendInvite,
  sendUserPasswordReset,
  setUserPassword,
  updateUser,
  updateUserAccounts,
} from "@/lib/users/users.functions";

export const Route = createFileRoute("/_protected/manage/users")({
  validateSearch: listUsersSearchSchema,
  loaderDeps: ({ search }) => ({ q: search.q, role: search.role, page: search.page }),
  loader: async ({ deps }) => {
    const [usersResult, accountsResult] = await Promise.all([
      listUsers({ data: { q: deps.q, role: deps.role, page: deps.page } }).then(
        asResult<PagedUsersResult>,
      ),
      listAccounts({ data: {} }).then(asResult<PagedAccountsResult>),
    ]);

    if (!usersResult.ok) throw new Error(usersResult.error.message);
    if (!accountsResult.ok) throw new Error(accountsResult.error.message);

    return {
      users: usersResult.value.users,
      total: usersResult.value.total,
      accounts: accountsResult.value.accounts,
    };
  },
  component: UsersPage,
});

function UsersPage() {
  const { user: currentUser } = Route.useRouteContext() as {
    user: { id: string; user_role?: string };
  };
  const { users: loadedUsers, total, accounts } = Route.useLoaderData();
  const currentUserId = currentUser.id;
  const canWriteUsers = can(currentUser.user_role, permissions.users.write);
  const canChangePassword = can(currentUser.user_role, permissions.users.changePassword);
  const search = Route.useSearch();
  const navigate = useNavigate();
  const routerLoading = useRouterState({ select: (s) => s.isLoading });
  const isLoading = useDelayedBoolean(routerLoading);

  const [users, setUsers] = useState<User[]>(loadedUsers);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);

  useEffect(() => {
    setUsers(loadedUsers);
  }, [loadedUsers]);

  const selectedUser = users.find((u) => u.id === selectedId) ?? null;
  const passwordUser = users.find((u) => u.id === passwordUserId) ?? null;
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const panelSide = isDesktop ? "right" : "bottom";
  const panelClassName = "overflow-y-auto p-0 sm:w-[50vw] sm:min-w-[800px]";

  const roleFilter: RoleFilter = search.role ?? "all";
  const searchQuery = search.q ?? "";
  const currentPage = search.page ?? 1;
  const totalPages = Math.ceil(total / userPageSize);

  function handleSearchChange(q: string) {
    void navigate({
      to: "/manage/users",
      search: { q: q || undefined, role: search.role, page: undefined },
      replace: true,
    });
  }

  function handleRoleFilterChange(role: RoleFilter) {
    void navigate({
      to: "/manage/users",
      search: { q: search.q, role: role === "all" ? undefined : role, page: undefined },
      replace: true,
    });
  }

  function handlePageChange(page: number) {
    void navigate({
      to: "/manage/users",
      search: { q: search.q, role: search.role, page: page === 1 ? undefined : page },
      replace: true,
    });
  }

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
          notificationPreferences: updated.notificationPreferences,
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
          notificationPreferences: draft.notificationPreferences,
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
      prev.map((u) => (u.id === userId ? { ...u, invitedAt: result.value.invitedAt } : u)),
    );
  }

  function handleDiscard() {
    setSelectedId(null);
    setCreating(false);
  }

  function handleManagePassword(user: User) {
    setSelectedId(null);
    setCreating(false);
    setPasswordUserId(user.id);
  }

  function handleClosePasswordPanel() {
    setPasswordUserId(null);
  }

  async function handleSetPassword(password: string): Promise<Result<void, { message: string }>> {
    if (!passwordUser) return { ok: false, error: { message: "No user selected" } };
    const result = asResult<void>(
      await setUserPassword({ data: { userId: passwordUser.id, password } }),
    );
    if (result.ok) {
      toast.success(`Password set — ${passwordUser.name} must change it on next sign-in`);
      setPasswordUserId(null);
    } else {
      toast.error(result.error.message);
    }
    return result;
  }

  async function handleSendPasswordReset(): Promise<Result<void, { message: string }>> {
    if (!passwordUser) return { ok: false, error: { message: "No user selected" } };
    const result = asResult<void>(await sendUserPasswordReset({ data: passwordUser.id }));
    if (result.ok) {
      toast.success(`Reset email sent to ${passwordUser.email}`);
    } else {
      toast.error(result.error.message);
    }
    return result;
  }

  return (
    <>
      <PageHeader
        title="Users"
        actions={
          <WhenAllowed permission={permissions.users.invite}>
            <Button onClick={handleStartCreate}>+ New user</Button>
          </WhenAllowed>
        }
      />
      <PageContent>
        <UserList
          users={users}
          total={total}
          selectedId={selectedId}
          roleFilter={roleFilter}
          searchQuery={searchQuery}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          currentUserId={currentUserId}
          readOnly={!canWriteUsers}
          onSelectUser={handleSelectUser}
          onRoleFilterChange={handleRoleFilterChange}
          onSearchChange={handleSearchChange}
          onPageChange={handlePageChange}
          onManagePassword={canChangePassword ? handleManagePassword : undefined}
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
                readOnly={!canWriteUsers}
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

        <Sheet open={!!passwordUser} onOpenChange={(open) => !open && handleClosePasswordPanel()}>
          <SheetContent
            side={panelSide}
            className={panelClassName}
            onInteractOutside={(e) => e.preventDefault()}
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Set password</SheetTitle>
              <SheetDescription>Set a temporary password for the user</SheetDescription>
            </SheetHeader>
            {passwordUser && (
              <SetUserPasswordPanel
                key={passwordUser.id}
                user={passwordUser}
                onSetPassword={handleSetPassword}
                onSendResetEmail={handleSendPasswordReset}
                onClose={handleClosePasswordPanel}
              />
            )}
          </SheetContent>
        </Sheet>
      </PageContent>
    </>
  );
}
