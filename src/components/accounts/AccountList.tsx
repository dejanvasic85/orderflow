import { Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
              <div className="flex items-center justify-end gap-1">
                <Link
                  to="/manage/accounts/$accountId/template"
                  params={{ accountId: account.id }}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[0.8rem] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Template
                </Link>
                <Separator orientation="vertical" className="h-4" />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAccount(account);
                  }}
                >
                  Edit
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
