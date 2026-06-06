import { ChevronsUpDownIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
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

type User = { id: string; name: string };

type Props = {
  users: User[];
  disabled?: boolean;
  onSelect: (userId: string) => void;
  trigger?: ReactNode;
};

export function UserSearchCombobox({ users, disabled, onSelect, trigger }: Props) {
  const [open, setOpen] = useState(false);

  function handleSelect(userId: string) {
    onSelect(userId);
    setOpen(false);
  }

  const defaultTrigger = (
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      disabled={disabled || users.length === 0}
      className="w-full justify-between font-normal text-muted-foreground"
    >
      {users.length === 0 ? "All users assigned" : "Add a user..."}
      <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
    </Button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger ?? defaultTrigger}</PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="end">
        <Command>
          <CommandInput placeholder="Search users..." />
          <CommandList>
            <CommandEmpty>No users found.</CommandEmpty>
            <CommandGroup>
              {users.map((user) => (
                <CommandItem key={user.id} value={user.name} onSelect={() => handleSelect(user.id)}>
                  {user.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
