import { Building2Icon, XIcon } from "lucide-react";
import { useEffect, useReducer, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UpdateUserAccountsInput, UserAccount } from "@/lib/users/schema";

type AccountChangeKind = "existing" | "added" | "removed";

type AccountState = {
  id: string;
  name: string;
  kind: AccountChangeKind;
};

type AccountsAction =
  | { type: "add"; account: { id: string; name: string } }
  | { type: "remove"; accountId: string }
  | { type: "commit" };

type Props = {
  userId: string;
  initialAccounts: UserAccount[];
  allAccounts: { id: string; name: string }[];
  onChange: (payload: UpdateUserAccountsInput) => void;
};

function accountsReducer(state: AccountState[], action: AccountsAction): AccountState[] {
  switch (action.type) {
    case "add": {
      const match = state.find((a) => a.id === action.account.id);
      if (!match) return [...state, { ...action.account, kind: "added" }];
      if (match.kind === "removed")
        return state.map((a) => (a.id === action.account.id ? { ...a, kind: "existing" } : a));
      return state;
    }
    case "remove": {
      const match = state.find((a) => a.id === action.accountId);
      if (!match) return state;
      if (match.kind === "added") return state.filter((a) => a.id !== action.accountId);
      return state.map((a) => (a.id === action.accountId ? { ...a, kind: "removed" as const } : a));
    }
    case "commit":
      return state
        .filter((a) => a.kind !== "removed")
        .map((a) => ({ ...a, kind: "existing" as const }));
  }
}

function buildPayload(userId: string, state: AccountState[]): UpdateUserAccountsInput {
  return {
    userId,
    toAdd: state.filter((a) => a.kind === "added").map((a) => a.id),
    toRemove: state.filter((a) => a.kind === "removed").map((a) => a.id),
  };
}

function toInitialState(accounts: UserAccount[]): AccountState[] {
  return accounts.map((a) => ({ ...a, kind: "existing" as const }));
}

export function UserAccountsSection({ userId, initialAccounts, allAccounts, onChange }: Props) {
  const [accounts, dispatch] = useReducer(accountsReducer, initialAccounts, toInitialState);
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const visibleAccounts = accounts.filter((a) => a.kind !== "removed");
  const visibleIds = new Set(visibleAccounts.map((a) => a.id));
  const availableAccounts = allAccounts.filter(
    (a) => !visibleIds.has(a.id) && a.name.toLowerCase().includes(search.toLowerCase()),
  );
  const allAssigned = allAccounts.every((a) => visibleIds.has(a.id));

  useEffect(() => {
    onChange(buildPayload(userId, accounts));
  }, [accounts, userId, onChange]);

  function handleAdd(account: { id: string; name: string }) {
    dispatch({ type: "add", account });
    setSearch("");
    setDropdownOpen(false);
  }

  function handleRemove(accountId: string) {
    dispatch({ type: "remove", accountId });
  }

  return (
    <div className="flex flex-col gap-3">
      <Label>Assigned accounts</Label>

      <div className="relative">
        <Input
          type="text"
          placeholder={allAssigned ? "All accounts assigned" : "Search accounts..."}
          disabled={allAssigned}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setDropdownOpen(true);
          }}
          onFocus={() => setDropdownOpen(true)}
          onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
        />
        {dropdownOpen && !allAssigned && (
          <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
            <Command shouldFilter={false}>
              <CommandList>
                {availableAccounts.length === 0 ? (
                  <CommandEmpty>No accounts found.</CommandEmpty>
                ) : (
                  <CommandGroup>
                    {availableAccounts.map((account) => (
                      <CommandItem
                        key={account.id}
                        value={account.name}
                        onSelect={() => handleAdd(account)}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        {account.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </div>
        )}
      </div>

      {visibleAccounts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-6 text-center">
          <Building2Icon className="size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No accounts assigned.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-1">
          {visibleAccounts.map((account) => (
            <li
              key={account.id}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2"
            >
              <span className="text-sm">{account.name}</span>
              <button
                type="button"
                aria-label={`Remove ${account.name}`}
                onClick={() => handleRemove(account.id)}
                className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <XIcon className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
