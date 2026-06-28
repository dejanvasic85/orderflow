import { Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

type QuantityStepperProps = {
  label: string;
  value: number;
  onChange: (next: number) => void;
};

function clampToNonNegativeInt(raw: string): number {
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 0) return 0;
  return parsed;
}

export function QuantityStepper({ label, value, onChange }: QuantityStepperProps) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  const handleInputChange = (raw: string) => {
    if (raw === "") {
      setText("");
      return;
    }
    if (!/^\d+$/.test(raw)) return;
    setText(raw);
    onChange(clampToNonNegativeInt(raw));
  };

  const handleBlur = () => {
    const next = clampToNonNegativeInt(text);
    setText(String(next));
    onChange(next);
  };

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <InputGroup className="w-[124px]">
        <InputGroupAddon align="inline-start">
          <InputGroupButton
            size="icon-xs"
            aria-label={`Decrease ${label.toLowerCase()}`}
            disabled={value <= 0}
            onClick={() => onChange(Math.max(0, value - 1))}
          >
            <Minus />
          </InputGroupButton>
        </InputGroupAddon>
        <InputGroupInput
          inputMode="numeric"
          pattern="[0-9]*"
          aria-label={`${label} quantity`}
          className="text-center font-medium tabular-nums"
          value={text}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={(e) => e.target.select()}
          onBlur={handleBlur}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label={`Increase ${label.toLowerCase()}`}
            onClick={() => onChange(value + 1)}
          >
            <Plus />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
