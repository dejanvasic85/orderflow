import { Link } from "@tanstack/react-router";
import { FileText, MoreHorizontal, PencilLine, ShoppingCart, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { ListSearchHeader } from "@/components/ListSearchHeader";
import { Paging } from "@/components/Paging";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import type { Account } from "@/lib/accounts/schema";

type Props = {
  accounts: Account[];
  total: number;
  selectedId: string | null;
  searchQuery: string;
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  onSelectAccount: (account: Account) => void;
  onSearchChange: (q: string) => void;
  onPageChange: (page: number) => void;
  readOnly?: boolean;
};

export function AccountList({
  accounts,
  total,
  selectedId,
  searchQuery,
  isLoading = false,
  currentPage,
  totalPages,
  onSelectAccount,
  onSearchChange,
  onPageChange,
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

  const showEmpty = !isLoading && accounts.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <ListSearchHeader
        value={inputValue}
        placeholder="Search by name..."
        ariaLabel="Search accounts"
        countLabel={`${total} ${total === 1 ? "account" : "accounts"}`}
        onChange={setInputValue}
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Users</TableHead>
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
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-40" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-8" />
                </TableCell>
                <TableCell />
              </TableRow>
            ))}

          {showEmpty && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground py-12 text-center text-sm">
                {searchQuery !== "" ? "No accounts match your search" : "No accounts found"}
              </TableCell>
            </TableRow>
          )}

          {!isLoading &&
            accounts.map((account) => (
              <TableRow
                key={account.id}
                data-state={selectedId === account.id ? "selected" : undefined}
                className="cursor-pointer"
                onClick={() => onSelectAccount(account)}
              >
                <TableCell className="font-medium">{account.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {account.contactName ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {account.contactEmail ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {account.contactPhone ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {account.userCount > 0 ? account.userCount : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="size-7 p-0"
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Account actions"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            onSelectAccount(account);
                          }}
                        >
                          <PencilLine className="size-4" />
                          {readOnly ? "View" : "Edit"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link
                            to="/manage/accounts/$accountId/template"
                            params={{ accountId: account.id }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FileText className="size-4" />
                            Template
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            to="/manage/accounts/$accountId/users"
                            params={{ accountId: account.id }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Users className="size-4" />
                            Users
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link
                            to="/manage/orders/new"
                            search={{ accountId: account.id }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ShoppingCart className="size-4" />
                            Place order
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
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
