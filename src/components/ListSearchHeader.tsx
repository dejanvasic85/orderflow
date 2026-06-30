import { Search } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

type Props = {
  value: string;
  placeholder: string;
  ariaLabel: string;
  countLabel?: string;
  onChange: (value: string) => void;
};

/**
 * Shared search header for list screens (accounts, users, orders).
 * On mobile the input takes the full width and the count sits below it,
 * giving the field room to breathe; from `sm` up it collapses back to a
 * single inline row with the count to the right.
 */
export function ListSearchHeader({ value, placeholder, ariaLabel, countLabel, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <InputGroup className="h-10 w-full sm:h-8 sm:max-w-sm">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          aria-label={ariaLabel}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </InputGroup>
      {countLabel !== undefined && (
        <span className="text-sm text-muted-foreground">{countLabel}</span>
      )}
    </div>
  );
}
