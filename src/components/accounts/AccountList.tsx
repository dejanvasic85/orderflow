import { Button } from "@/components/ui/button";
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
