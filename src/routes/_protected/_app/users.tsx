import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { UserEditPanel } from "@/components/users/UserEditPanel";
import { UserList } from "@/components/users/UserList";
import { mockUsers, type MockUser } from "@/components/users/mockData";
import { PageContent } from "@/components/layout/PageContent";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_protected/_app/users")({
  component: UsersPage,
});

type RoleFilter = "all" | "admin" | "staff" | "user";

function UsersPage() {
  const [users, setUsers] = useState<MockUser[]>(mockUsers);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const selectedUser = users.find((u) => u.id === selectedId) ?? null;

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
        <div
          className={
            selectedUser ? "grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]" : "grid grid-cols-1"
          }
        >
          <UserList
            users={users}
            selectedId={selectedId}
            roleFilter={roleFilter}
            onSelectUser={handleSelectUser}
            onRoleFilterChange={setRoleFilter}
          />

          {selectedUser && (
            <UserEditPanel
              key={selectedUser.id}
              user={selectedUser}
              onSave={handleSave}
              onDiscard={handleDiscard}
            />
          )}
        </div>
      </PageContent>
    </>
  );
}
