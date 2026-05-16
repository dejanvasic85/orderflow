import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { listUsers } from "@/lib/users/queries";
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
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  useEffect(() => {
    setUsers(loadedUsers);
  }, [loadedUsers]);

  const selectedUser = users.find((u) => u.id === selectedId) ?? null;
  const isDesktop = useMediaQuery("(min-width: 640px)");

  function handleSelectUser(user: User) {
    setSelectedId(user.id);
  }

  function handleSave(updated: User) {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setSelectedId(null);
  }

  function handleDiscard() {
    setSelectedId(null);
  }

  return (
    <>
      <PageHeader title="Users" actions={<Button onClick={() => {}}>+ New user</Button>} />
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
            side={isDesktop ? "right" : "bottom"}
            className="overflow-y-auto p-0 sm:w-[600px] sm:max-w-[600px]"
          >
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
              />
            )}
          </SheetContent>
        </Sheet>
      </PageContent>
    </>
  );
}
