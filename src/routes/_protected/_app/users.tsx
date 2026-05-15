import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
import { mockUsers, type MockUser } from "@/components/users/mockData";
import { UserEditPanel } from "@/components/users/UserEditPanel";
import { UserList } from "@/components/users/UserList";
import { useMediaQuery } from "@/hooks/use-media-query";

export const Route = createFileRoute("/_protected/_app/users")({
  component: UsersPage,
});

type RoleFilter = "all" | "admin" | "staff" | "user";

function UsersPage() {
  const [users, setUsers] = useState<MockUser[]>(mockUsers);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const selectedUser = users.find((u) => u.id === selectedId) ?? null;
  const isDesktop = useMediaQuery("(min-width: 640px)");

  function handleSelectUser(user: MockUser) {
    setSelectedId(user.id);
  }

  function handleSave(updated: MockUser) {
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
