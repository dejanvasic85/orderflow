import { MoreHorizontal, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { Paging } from "@/components/Paging";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebounce } from "@/hooks/use-debounce";
import { type User, type UserRole, userRoles } from "@/lib/users/schema";
import { cn } from "@/lib/utils";
import { UserStatusBadge } from "./UserStatusBadge";

export type RoleFilter = "all" | UserRole;

type Props = {
  users: User[];
  total: number;
  selectedId: string | null;
  roleFilter: RoleFilter;
  searchQuery: string;
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  currentUserId?: string;
  onSelectUser?: (user: User) => void;
  onRoleFilterChange: (filter: RoleFilter) => void;
  onSearchChange: (q: string) => void;
  onPageChange: (page: number) => void;
  onManagePassword?: (user: User) => void;
  readOnly?: boolean;
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
  total,
  selectedId,
  roleFilter,
  searchQuery,
  isLoading = false,
  currentPage,
  totalPages,
  currentUserId,
  onSelectUser,
  onRoleFilterChange,
  onSearchChange,
  onPageChange,
  onManagePassword,
  readOnly,
}: Props) {
  const [inputValue, setInputValue] = useState(searchQuery);
  const debouncedInput = useDebounce(inputValue, 300);

  useEffect(() => {
    if (debouncedInput !== searchQuery) onSearchChange(debouncedInput);
  }, [debouncedInput]);

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  const showEmpty = !isLoading && users.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <InputGroup className="max-w-sm">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search users"
            placeholder="Search by name or email..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </InputGroup>
        <span className="text-sm text-muted-foreground">
          {total} {total === 1 ? "user" : "users"}
        </span>
      </div>

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
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-48" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-8" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell />
              </TableRow>
            ))}

          {showEmpty && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground py-12 text-center text-sm">
                {searchQuery !== "" || roleFilter !== "all"
                  ? "No users match your search"
                  : "No users found"}
              </TableCell>
            </TableRow>
          )}

          {!isLoading &&
            users.map((user) => (
              <TableRow
                key={user.id}
                data-state={selectedId === user.id ? "selected" : undefined}
                className={onSelectUser ? "cursor-pointer" : undefined}
                onClick={() => onSelectUser?.(user)}
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
                  <UserStatusBadge
                    status={
                      !user.active ? "inactive" : !user.invite_accepted_at ? "pending" : "active"
                    }
                  />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" aria-label="User actions">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuGroup>
                        {onSelectUser && (
                          <DropdownMenuItem onSelect={() => onSelectUser(user)}>
                            {readOnly ? "View" : "Edit"}
                          </DropdownMenuItem>
                        )}
                        {onManagePassword && currentUserId !== user.id && (
                          <DropdownMenuItem onSelect={() => onManagePassword(user)}>
                            Set password
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      <Paging
        currentPage={currentPage}
        totalPages={totalPages}
        isLoading={isLoading}
        onPageChange={onPageChange}
      />
    </div>
  );
}
