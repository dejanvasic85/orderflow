import { BuildingIcon, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

type Account = {
  id: string;
  name: string;
};

type AccountSelectionViewProps = {
  accounts: Account[];
  onSelectAccount: (accountId: string) => void;
  onSignOut: () => void;
};

export function AccountSelectionView({
  accounts,
  onSelectAccount,
  onSignOut,
}: AccountSelectionViewProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        {accounts.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BuildingIcon />
              </EmptyMedia>
              <EmptyTitle>No Account Assigned</EmptyTitle>
              <EmptyDescription className="max-w-xs text-pretty">
                Contact your administrator to get access to an account.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Select an account
              </p>
              <p className="text-base">Which account are you ordering for?</p>
            </div>
            <div className="flex flex-col gap-2">
              {accounts.map((account) => (
                <Button
                  key={account.id}
                  variant="outline"
                  className="h-12 w-full justify-between px-4"
                  onClick={() => onSelectAccount(account.id)}
                >
                  <span className="font-medium">{account.name}</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Button>
              ))}
            </div>
          </>
        )}

        <Button variant="outline" className="self-center" onClick={onSignOut}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
