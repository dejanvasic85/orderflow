import { Link } from "@tanstack/react-router";
import { FileText, MoreHorizontal, PencilLine, ShoppingCart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Account } from "@/lib/accounts/schema";

type Props = {
  accounts: Account[];
  selectedId: string | null;
  onSelectAccount: (account: Account) => void;
};

export function AccountList({ accounts, selectedId, onSelectAccount }: Props) {
  return (
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
        {accounts.map((account) => (
          <TableRow
            key={account.id}
            data-state={selectedId === account.id ? "selected" : undefined}
            className="cursor-pointer"
            onClick={() => onSelectAccount(account)}
          >
            <TableCell className="font-medium">{account.name}</TableCell>
            <TableCell className="text-muted-foreground">{account.contact_name ?? "—"}</TableCell>
            <TableCell className="text-muted-foreground">{account.contact_email ?? "—"}</TableCell>
            <TableCell className="text-muted-foreground">{account.contact_phone ?? "—"}</TableCell>
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
                      Edit
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
  );
}
