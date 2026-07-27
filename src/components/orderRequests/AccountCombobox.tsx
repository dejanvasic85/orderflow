import { useQuery } from "@tanstack/react-query";
import { ChevronsUpDownIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDebounce } from "@/hooks/use-debounce";
import { listAccounts } from "@/lib/accounts/accounts.functions";
import type { PagedAccountsResult } from "@/lib/accounts/schema";
import { asResult } from "@/lib/result";
import { unwrapOrThrow } from "@/lib/resultLoader";

const searchDebounceMs = 300;

type AccountOption = { id: string; name: string };

type AccountComboboxProps = {
  selected: AccountOption | null;
  onSelect: (accountId: string) => void;
};

export function AccountCombobox({ selected, onSelect }: AccountComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const search = useDebounce(inputValue, searchDebounceMs);

  const accountsQuery = useQuery({
    queryKey: ["accounts", "search", search],
    enabled: open,
    placeholderData: (previous) => previous,
    queryFn: async () => {
      const result = asResult<PagedAccountsResult>(await listAccounts({ data: { q: search } }));
      return unwrapOrThrow(result).accounts;
    },
  });

  const accounts = accountsQuery.data ?? [];

  function handleSelect(accountId: string) {
    onSelect(accountId);
    setOpen(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) setInputValue("");
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={selected ? undefined : "text-muted-foreground"}>
            {selected ? selected.name : "Select an account..."}
          </span>
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            aria-label="Search accounts"
            placeholder="Search accounts..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            {accountsQuery.isError ? (
              <div className="flex flex-col items-center gap-2 py-6 text-sm text-muted-foreground">
                <span>Could not load accounts.</span>
                <Button variant="outline" size="sm" onClick={() => void accountsQuery.refetch()}>
                  Try again
                </Button>
              </div>
            ) : accountsQuery.isFetching ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Searching...</div>
            ) : (
              <CommandEmpty>No accounts found.</CommandEmpty>
            )}
            <CommandGroup>
              {accounts.map((account) => (
                <CommandItem
                  key={account.id}
                  value={account.id}
                  onSelect={() => handleSelect(account.id)}
                >
                  {account.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
