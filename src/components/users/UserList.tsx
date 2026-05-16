import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type User, type UserRole, userRoles } from "@/lib/users/schema";
import { cn } from "@/lib/utils";
import { UserStatusBadge } from "./UserStatusBadge";

export type RoleFilter = "all" | UserRole;

type Props = {
  users: User[];
  selectedId: string | null;
  roleFilter: RoleFilter;
  onSelectUser: (user: User) => void;
  onRoleFilterChange: (filter: RoleFilter) => void;
};

const roleLabelMap: Record<UserRole, string> = {
  admin: "Admin",
  staff: "Staff",
  user: "User",
};

const roleFilters: { label: string; value: RoleFilter }[] = [
  { label: "All roles", value: "all" },
  ...userRoles.map((role) => ({ label: roleLabelMap[role], value: role })),
];

export function UserList({
  users,
  selectedId,
  roleFilter,
  onSelectUser,
  onRoleFilterChange,
}: Props) {
  const filtered = roleFilter === "all" ? users : users.filter((u) => u.role === roleFilter);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1.5">
        {roleFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => onRoleFilterChange(f.value)}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium transition-colors",
              roleFilter === f.value
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Accounts</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((user) => (
            <TableRow
              key={user.id}
              data-state={selectedId === user.id ? "selected" : undefined}
              className="cursor-pointer"
              onClick={() => onSelectUser(user)}
            >
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell>
                <Badge variant="secondary">{roleLabelMap[user.role]}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {user.accounts.length > 0 ? user.accounts.length : "—"}
              </TableCell>
              <TableCell>
                <UserStatusBadge status={user.active ? "active" : "inactive"} />
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectUser(user);
                  }}
                >
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
